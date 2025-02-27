"use server";
import { generateRegistrationOptions, generateAuthenticationOptions, verifyRegistrationResponse, verifyAuthenticationResponse, RegistrationResponseJSON, AuthenticationResponseJSON, WebAuthnCredential } from '@simplewebauthn/server';

import { sessions } from "@/session/store";
import { RouteContext } from '@redwoodjs/sdk/router';
import { db } from '@/db';

export async function startPasskeyRegistration(username: string, ctx?: RouteContext) {
  const { headers, env } = ctx!;

  const options = await generateRegistrationOptions({
    rpName: env.APP_NAME,
    rpID: env.RP_ID,
    userName: username,
    authenticatorSelection: {
      // Require the authenticator to store the credential, enabling a username-less login experience
      residentKey: 'required',
      // Prefer user verification (biometric, PIN, etc.), but allow authentication even if it's not available
      userVerification: 'preferred',
    },
  });

  await sessions.save(headers, { challenge: options.challenge });

  return options;
}

export async function finishPasskeyRegistration(username: string, registration: RegistrationResponseJSON, ctx?: RouteContext) {
  const { request, headers, env } = ctx!;
  const { origin } = new URL(request.url);

  const session = await sessions.load(request);
  const challenge = session?.challenge;

  if (!challenge) {
    return false
  }

  const verification = await verifyRegistrationResponse({
    response: registration,
    expectedChallenge: challenge,
    expectedOrigin: origin,
    expectedRPID: env.RP_ID,
  });

  if (!verification.verified || !verification.registrationInfo) {
    return false;
  }

  await sessions.save(headers, { challenge: null });

  const user = await db.user.create({
    data: {
      username,
    },
  });

  await db.credential.create({
    data: {
      userId: user.id,
      credentialId: verification.registrationInfo.credential.id,
      publicKey: verification.registrationInfo.credential.publicKey,
      counter: verification.registrationInfo.credential.counter,
    },
  });

  return true
}

export async function startPasskeyLogin(ctx?: RouteContext) {
  const { request, headers, env } = ctx!;

  const options = await generateAuthenticationOptions({
    rpID: env.RP_ID,
    userVerification: 'preferred',
    allowCredentials: [],
  });

  await sessions.save(headers, { challenge: options.challenge });

  return options;
}

export async function finishPasskeyLogin(login: AuthenticationResponseJSON, ctx?: RouteContext) {
  const { request, headers, env } = ctx!;
  const { origin } = new URL(request.url);

  const session = await sessions.load(request);
  const challenge = session?.challenge;

  if (!challenge) {
    return false
  }

  const credential = await db.credential.findUnique({
    where: {
      credentialId: login.id,
    },
  });

  if (!credential) {
    return false
  };

  const verification = await verifyAuthenticationResponse({
    response: login,
    expectedChallenge: challenge,
    expectedOrigin: origin,
    expectedRPID: env.RP_ID,
    requireUserVerification: false,
    credential: {
      id: credential.credentialId,
      publicKey: credential.publicKey,
      counter: credential.counter,
    },
  });

  if (!verification.verified) {
    return false;
  }

  await db.credential.update({
    where: {
      credentialId: login.id
    },
    data: {
      counter: verification.authenticationInfo.newCounter,
    },
  });

  const user = await db.user.findUnique({
    where: {
      id: credential.userId,
    },
  });

  if (!user) {
    return false;
  }

  await sessions.save(headers, {
    userId: user.id,
    challenge: null
  });

  return true
}
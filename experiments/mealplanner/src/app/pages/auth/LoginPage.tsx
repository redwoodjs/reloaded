"use client";

import { useState, useTransition } from 'react';
import { startAuthentication, startRegistration } from '@simplewebauthn/browser';
import { finishPasskeyLogin, finishPasskeyRegistration, startPasskeyLogin, startPasskeyRegistration } from './functions';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/app/components/ui/tabs";
import { Alert, AlertDescription } from "@/app/components/ui/alert";
import { Fingerprint, KeyRound, Loader2, UserPlus, LogIn } from "lucide-react";

export function LoginPage() {
  const [username, setUsername] = useState('');
  const [result, setResult] = useState('');
  const [isPending, startTransition] = useTransition();
  const [activeTab, setActiveTab] = useState("login");

  const passkeyLogin = async () => {
    setResult('');
    const options = await startPasskeyLogin();
    const login = await startAuthentication({ optionsJSON: options });
    const success = await finishPasskeyLogin(login);

    if (!success) {
      setResult('Login failed');
    } else {
      setResult('Login successful! Redirecting...');
      setTimeout(() => {
        window.location.href = '/';
      }, 1000);
    }
  }

  const passkeyRegister = async () => {
    setResult('');
    if (!username.trim()) {
      setResult('Please enter a username');
      return;
    }

    const options = await startPasskeyRegistration(username);
    const registration = await startRegistration({ optionsJSON: options });
    const success = await finishPasskeyRegistration(username, registration);

    if (!success) {
      setResult('Registration failed');
    } else {
      setResult('Registration successful! You can now log in.');
      setActiveTab("login");
    }
  }

  const handlePerformPasskeyLogin = () => {
    startTransition(() => void passkeyLogin());
  };

  const handlePerformPasskeyRegister = () => {
    startTransition(() => void passkeyRegister());
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-gradient-to-b from-blue-50 to-white p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">Meal Planner</CardTitle>
          <CardDescription className="text-center">
            Access your personalized meal plans with secure passkey authentication
          </CardDescription>
        </CardHeader>
        
        <Tabs defaultValue="login" value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid grid-cols-2 w-full">
            <TabsTrigger value="login" className="flex items-center gap-2">
              <LogIn className="h-4 w-4" />
              Login
            </TabsTrigger>
            <TabsTrigger value="register" className="flex items-center gap-2">
              <UserPlus className="h-4 w-4" />
              Register
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="login" className="p-4 pt-6">
            <div className="space-y-4">
              <div className="text-center">
                <Button 
                  onClick={handlePerformPasskeyLogin} 
                  disabled={isPending}
                  className="w-full"
                  size="lg"
                >
                  {isPending ? (
                    <span className="flex items-center justify-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Authenticating...
                    </span>
                  ) : (
                    <span className="flex items-center justify-center gap-2">
                      <Fingerprint className="h-5 w-5" />
                      Login with Passkey
                    </span>
                  )}
                </Button>
              </div>
              
              <div className="text-center text-sm text-gray-500">
                <p>Use your device's biometric authentication or security key</p>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="register" className="p-4 pt-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input 
                  id="username" 
                  type="text" 
                  value={username} 
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter a username"
                />
              </div>
              
              <Button 
                onClick={handlePerformPasskeyRegister} 
                disabled={isPending || !username.trim()}
                className="w-full"
                size="lg"
              >
                {isPending ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Registering...
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    <KeyRound className="h-5 w-5" />
                    Register with Passkey
                  </span>
                )}
              </Button>
              
              <div className="text-center text-sm text-gray-500">
                <p>Create a new account with passkey authentication</p>
              </div>
            </div>
          </TabsContent>
        </Tabs>
        
        <CardFooter className="flex flex-col">
          {result && (
            <Alert className={`w-full mt-4 ${result.includes('failed') ? 'bg-red-50 text-red-800' : result.includes('successful') ? 'bg-green-50 text-green-800' : 'bg-blue-50 text-blue-800'}`}>
              <AlertDescription>{result}</AlertDescription>
            </Alert>
          )}
          
          <div className="mt-6 text-center text-xs text-gray-500">
            <p>Passkeys provide a more secure alternative to passwords</p>
            <p className="mt-1">Your biometric data never leaves your device</p>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
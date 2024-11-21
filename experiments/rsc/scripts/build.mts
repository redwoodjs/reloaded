import { build } from 'vite';
import { viteConfigs } from './viteConfigs.mjs';
import { buildVendorBundles } from './buildVendorBundles.mjs';
import { $ } from 'execa';

const main = async () => {
  await buildVendorBundles()
  await $`pnpm prisma generate`
  await build(viteConfigs.workerDeploymentBuild())
}

main()

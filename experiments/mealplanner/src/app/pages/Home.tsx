import { Context } from '@/worker'
import { Layout } from '../Layout';
import { db } from '@/db';

export async function Home({ ctx }: { ctx: Context }) {
  // find user in db and check if it has a setup

  return (
    <Layout ctx={ctx}>
      <h1>Home</h1>
    </Layout>
  );
}

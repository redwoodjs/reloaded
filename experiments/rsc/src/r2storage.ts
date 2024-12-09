export let R2Storage: ReturnType<typeof createR2Storage>;

async function uploadFile(file: File, env: Env) {
  const filename = file.name;
  await env.valley_directory_r2.put(filename, file);
  return filename;
}

export const createR2Storage = (env: Env) => {
  const storage = {
    uploadFile: async (file: Blob, filename: string) => {
        await env.valley_directory_r2.put(filename, file);
        if (await env.valley_directory_r2.get(filename) === null) {
            console.log("Error uploading file");
            throw new Error("File not uploaded");
        }
        return filename;
    },
    listFiles: async () => await env.valley_directory_r2.list(),
  };
  R2Storage = storage;
  return storage;
};


export const setupR2Storage = (env: Env) => {
  R2Storage = createR2Storage(env);
};  
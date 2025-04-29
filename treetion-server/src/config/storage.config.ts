// src/config/storage.config.ts
export default () => ({
    storage: {
      provider: process.env.STORAGE_PROVIDER || 'r2',
      r2: {
        accountId: process.env.R2_ACCOUNT_ID,
        accessKeyId: process.env.R2_ACCESS_KEY_ID,
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
        bucket: process.env.R2_BUCKET_NAME,
        publicUrl: process.env.R2_PUBLIC_URL,
      },
      supabase: {
        url: process.env.SUPABASE_URL,
        key: process.env.SUPABASE_SERVICE_KEY,
        bucket: 'audio'
      }
    }
  });
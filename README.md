# ClientFlow

ClientFlow is a business management platform designed to help businesses manage their customers, enquiries and workflow.

## Technology

- Frontend: HTML, CSS and JavaScript
- Database: Supabase
- AI chat: OpenAI via a Supabase Edge Function

## Run locally

Install dependencies and run the Vite development server:

```sh
npm install
npm run dev
```

## Enable the AI chat

The chat feature uses a Supabase Edge Function so the OpenAI API key is never included in browser code.

1. Create an OpenAI API key in your OpenAI account.
2. Install and sign in to the [Supabase CLI](https://supabase.com/docs/guides/cli).
3. Set the key as a Supabase secret and deploy the function:

   ```sh
   supabase secrets set OPENAI_API_KEY=your_openai_api_key
   supabase functions deploy chat
   ```

4. Optionally set a different model with the `OPENAI_MODEL` secret. The default is `gpt-4o-mini`.
5. Open the deployed app and try the **Chat with ClientFlow AI** panel.

For local function development, set `OPENAI_API_KEY` in the Supabase local environment and run `supabase functions serve chat`.

## Security note

The current app has no user authentication, so the chat function is callable by anyone who can access the app. Add authentication and server-side rate limiting or abuse protection before using this with real OpenAI billing. Chat messages go to OpenAI; client directory records are not sent. Avoid entering sensitive or confidential information.

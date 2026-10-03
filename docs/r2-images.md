# R2 image delivery

Coin Archive stores R2 object keys in PostgreSQL and derives public image URLs
at the API boundary. It does not store deployment-specific URLs, R2
credentials, or image bytes in catalogue records.

This is an operator guide only. The repository does not create a bucket,
change DNS, issue credentials, or upload objects automatically.

## Public bucket and custom domain

1. Create a dedicated R2 bucket for public catalogue images in the Cloudflare
   dashboard.
2. Open the bucket's **Settings**, then under **Public access > Custom
   Domains**, connect a hostname such as `images.example.com`.
3. Keep the `r2.dev` development URL disabled in production. A custom domain
   is required for Cloudflare Cache, WAF, and related controls; enabling the
   custom domain makes objects publicly readable when their URLs are known.
4. Set the API deployment's `IMAGE_BASE_URL` to the custom-domain origin, with
   no path, query, or fragment:

   ```dotenv
   IMAGE_BASE_URL=https://images.example.com
   ```

The API joins that origin with the persisted key. For example,
`coin-placeholder.webp` becomes
`https://images.example.com/coin-placeholder.webp`. See Cloudflare's
[public bucket](https://developers.cloudflare.com/r2/buckets/public-buckets/)
and [R2 cache](https://developers.cloudflare.com/cache/interaction-cloudflare-products/r2/)
guides for the dashboard workflow and current behavior.

## Upload credentials

Create an R2 API token with **Object Read & Write**, restricted to this one
bucket. Do not use an account-wide Admin token for the catalogue workflow.
Record the Access Key ID and Secret Access Key when the token is created; the
secret is shown only once. Store both in the deployment secret manager, never
in this repository or a browser bundle, and rotate them if exposed.

Public read access through the custom domain does not grant write access.
Uploads continue to require the scoped S3-compatible credentials. The endpoint
is `https://<ACCOUNT_ID>.r2.cloudflarestorage.com` (or the documented
jurisdiction-specific endpoint), with region `auto`. Cloudflare documents the
available scopes in [R2 authentication](https://developers.cloudflare.com/r2/api/tokens/).

For the representative local asset, an operator can upload the existing file
under the key stored by the seed document:

```bash
aws s3 cp apps/web/public/coin-placeholder.webp \
  s3://<BUCKET_NAME>/coin-placeholder.webp \
  --endpoint-url https://<ACCOUNT_ID>.r2.cloudflarestorage.com \
  --content-type image/webp \
  --cache-control 'public, max-age=31536000, immutable'
```

Use a dedicated AWS CLI profile or environment-scoped credentials rather than
putting secrets in the command line. The [Cloudflare AWS CLI guide](https://developers.cloudflare.com/r2/examples/aws/aws-cli/)
has the credential setup and additional commands.

## Cache-aware delivery

- Use immutable or versioned object keys before setting a long browser TTL.
  Replacing bytes at a long-lived key can leave stale copies in browsers even
  after Cloudflare's edge cache is purged.
- Set suitable `Cache-Control` metadata when uploading each object. The sample
  command uses a one-year immutable policy because its key should change when
  its contents change.
- Configure a Cache Rule for the image hostname if the required file types or
  edge TTL differ from Cloudflare's default cache behavior. Consider Smart
  Tiered Cache to reduce repeated R2 fetches across edge locations.
- Verify a deployed object with repeated `HEAD` or `GET` requests and inspect
  `Cache-Control`, `Age`, and `CF-Cache-Status` rather than assuming it is
  cached.

Browser and edge TTLs are separate. Cloudflare's [TTL guide](https://developers.cloudflare.com/cache/how-to/edge-browser-cache-ttl/)
describes their interaction. CORS is not required merely to display a public
image with an HTML `img` element; add a narrow bucket CORS policy only if a
future browser workflow reads image bytes from JavaScript or canvas.

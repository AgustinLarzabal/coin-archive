# Manual Staging Reset and Reseed

Normal staging deployments will preserve their existing demo data. A separate manually invoked workflow will reset and reseed staging when a clean, repeatable state is needed. This avoids erasing staging access setup and ongoing verification state on every merge while retaining a reliable reset path.

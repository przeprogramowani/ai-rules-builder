# Description

Please include a summary of the changes and the related issue. Please also include relevant motivation and context.

## Type of change

Please delete options that are not relevant.

- [ ] Bug fix (non-breaking change which fixes an issue)
- [ ] New feature (non-breaking change which adds functionality)
- [ ] Breaking change (fix or feature that would cause existing functionality to not work as expected)
- [ ] Documentation update

# How Has This Been Tested?

Please describe the tests that you ran to verify your changes.

- [ ] Unit Tests
- [ ] E2E Tests

## Important Note for Fork-Based PRs

If you're submitting a PR from a forked repository, please note that E2E tests require specific repository-level environment (`integration`) and secrets to be set up. These are described in `.env.example` and include:

```bash
PUBLIC_ENV_NAME=integration
SUPABASE_URL=###
SUPABASE_PUBLIC_KEY=###

E2E_USERNAME_ID=###
E2E_USERNAME=###
E2E_PASSWORD=###
```

Please ensure these are properly configured in your fork's repository settings under "Secrets and variables" → "Actions" before running E2E tests.

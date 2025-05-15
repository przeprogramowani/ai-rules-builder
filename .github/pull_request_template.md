# Description

Please include a summary of the changes and the related issue. Please also include relevant motivation and context.

## Roadmap alignment

To maintain project quality and avoid wasted effort, all major changes must start with a GitHub issue discussion. Please create an issue describing your proposed changes, wait for maintainer feedback and approval, and only then proceed with coding. This helps us ensure alignment with project goals before you invest time in implementation.

- [ ] I have opened an issue first and received approval before working on this PR.

## Type of change

Please delete options that are not relevant.

- [ ] Bug fix (non-breaking change which fixes an issue)
- [ ] New feature (non-breaking change which adds functionality)
- [ ] Breaking change (fix or feature that would cause existing functionality to not work as expected)
- [ ] Documentation update

# How Has This Been Tested?

Please describe the tests that you ran to verify your changes.

- [ ] Manual Tests
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

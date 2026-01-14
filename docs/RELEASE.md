# RELEASE

## Checklist
- Bump the version in `package.json`
- Run `npm test`
- Run `npm run pack:check`
- Review `git status` and `git diff`
- Tag the release
- Publish to npm

## Commands
```bash
git tag vX.Y.Z
git push --tags
npm publish --access public
```

## Common errors
- "token expired": run `npm logout` then `npm login`
- "not authorized": verify org rights for publish
- "2FA required": enable npm 2FA for publish

# RELEASE

Requirements
- Bump the version in `package.json` before publishing

Publish steps
```
npm logout
npm login
npm whoami
npm publish --access public
```

Common errors
- "token expired": run `npm logout` then `npm login`
- "not authorized": you’re not publishing as an org member with rights
- "2FA required": enable npm 2FA for publish

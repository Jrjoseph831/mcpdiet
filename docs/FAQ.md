# FAQ

## Why does this exist?
Agents waste tokens and time when they load too many tool schemas and run uncontrolled tool calls. mcpdiet is meant to keep runs lean and auditable.

## Is this production ready?
No. This is an early preview CLI. The goal is to iterate quickly.

## What does `mcpdiet init` do?
Creates `.mcpdiet.json` in the current folder with sane defaults.

## Where will logs go?
Planned: `.mcpdiet/logs/` (exportable). Early versions may only print to console.

## How do I test the CLI command locally?
Run:
```
npm link
mcpdiet --help
```

How do I uninstall the global link?

```
npm unlink -g @lowloadlabs/mcpdiet-cli
```

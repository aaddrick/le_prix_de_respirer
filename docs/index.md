# Docs

The front door is the repo [README](../README.md). This folder holds what a
contributor, human or agent, needs in order to change the calculator without
breaking it. Pages are grouped by what you are trying to do.

## Start here

- [Getting started](getting-started.md): running it locally, and the two pages
  it serves.

## Changing it

- [Architecture](architecture.md): the modules, how an input change reaches
  the screen, the tabs, and why DOM ids are load bearing.
- [Tax rules](tax-rules.md): where every rate lives, the data layout, sources
  and flags, the order of operations, and how to update a year or add a
  jurisdiction.

## Checking it

- [Testing](testing.md): the Node check, the reference scenarios, and the
  manual pass.
- [Troubleshooting](troubleshooting.md).
- [Test methodology and coverage](learnings/test-methodology-and-coverage.md):
  how to write a check that can fail, and how to prove it can.

## Contributing

Repository rules are in [CLAUDE.md](../CLAUDE.md). Rules for editing these
pages are in [docs/CLAUDE.md](CLAUDE.md).

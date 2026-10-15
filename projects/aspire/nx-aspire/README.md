# @jaxvik/nx-aspire

An [Nx](https://nx.dev) plugin for [.NET Aspire](https://learn.microsoft.com/dotnet/aspire/) projects.

It automatically detects projects containing an `aspire.config.json` (Aspire AppHost projects) and infers a `run` target that starts the AppHost with the Aspire CLI.

## Setup

Requires Node.js 22.12 or later.

```sh
npm install -D @jaxvik/nx-aspire
```

Then run the init generator to install the Aspire CLI and register the plugin in `nx.json`:

```sh
npx nx g @jaxvik/nx-aspire:init
```

## Usage

Any project with an `aspire.config.json` at its root is detected automatically. Nx infers a `run` target for it:

```sh
npx nx run my-apphost:run
```

This runs `aspire run` in the project directory, starting the Aspire AppHost (dashboard and all resources it orchestrates).

### Configuration

The plugin accepts options via the `plugins` entry in `nx.json`:

```json
{
  "plugins": [
    {
      "plugin": "@jaxvik/nx-aspire",
      "options": {
        "runTargetName": "serve"
      }
    }
  ]
}
```

| Option | Default | Description |
| --- | --- | --- |
| `runTargetName` | `run` | Name of the inferred target that runs the AppHost. |

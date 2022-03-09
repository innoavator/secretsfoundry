#!/usr/bin/env node
import { Command } from 'commander';
import { writeFileSync } from 'fs';
import { unflatten } from 'flat';
import { stringify } from 'yaml';

import { SecretsFoundry } from './SecretsFoundry';
import { Loaders } from './loaders';
import Utils, { Options } from './utils';
import { version } from '../package.json';


const program = new Command();
program
  .version(version, '-V, --version', 'output the current version')
  .command('run')
  .option('--stage <string>', 'Stage of the service', '')
  .option('-i, --input <string>', 'Input file containing variables (.env/json/yaml)')
  .option('-o, --output <string>', 'Output file to write resolved variables (json/yaml)')
  .option('-c, --command <string>', 'Single command to run')
  .option('-s, --script <string>', 'Multiple Commands to run like cd ~/ && ls')
  .option(
    '-p, --path <string>',
    'Path to the config directory, that holds the .env files. Defaults to current directory'
  )
  .description(
    'Run the process in command/script after injecting the environment variables'
  )
  .action(async (options: Options) => {
    Utils.validateInput(options);
    const secretsFoundry = new SecretsFoundry(Loaders);
    try {
      const result = await secretsFoundry.extractValues(
        options.stage,
        options.path,
        options.input
      );
      if (!options.command && !options.script && !options.output) {
        // if the user doesn't provide a command, a script or output file, we will just log the result from parsing
        // the .env file
        console.log(JSON.stringify(result, null, 2));
        return;
      }

      if (options.output) {
        if (options.output.endsWith('.json')) {
          writeFileSync(options.output, JSON.stringify(unflatten(result)));
        }
        else if (options.output.endsWith('.yaml')) {
          writeFileSync(options.output, stringify(unflatten(result)));
        } else {
          throw new Error('Output file need to be YAML or JSON')
        }
      }

      for (const key in result) {
        process.env[key] = result[key] as string;
      }
    } catch (err) {
      console.error(err);
      process.exit();
    }

    let args: string[] = [];
    if (options.command) {
      args = options.command.split(' ');
    } else if (options.script) {
      args = Utils.getScriptArgs(options.script);
    } else {
      return;
    }
    Utils.runChildProcess(args[0], args.splice(1));
  });

program.parse(process.argv);

import BaseLoader from './BaseLoader';
const os = require('os');
const path = require('path');
const { readFileSync } = require('fs');

export default class AWSLoader implements BaseLoader {
  public loadData(aws_variable: string): string {
    const awsDir = path.join(path.join(os.homedir(), '.aws'), 'credentials');

    let fileContents: string[] = readFileSync(awsDir, 'utf-8').split('\n');
    for (const content of fileContents) {
      if (content.startsWith(aws_variable)) {
        return content.split('=', 2)[1];
      }
    }

    const msg = `Cannot find any AWS CREDENTIAL named ${aws_variable}`;
    throw Error(msg);
  }
}

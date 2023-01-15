const { flags, Command } = require("@oclif/command");
const { cli } = require("cli-ux");
import { run } from "../html2svelte/index";
import fs from "fs";

// read file
export const readFile = (file: any) => {
  return new Promise((resolve, reject) => {
    fs.readFile(file, "utf8", (err: any, data: any) => {
      if (err) reject(err);
      else resolve(data);
    });
  });
};

class ConvertCommand extends Command {
  async run() {
    const { flags, args } = this.parse(ConvertCommand);

    cli.action.start("Converting");

    const fileName = args.file;

    const dir = "./build";
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir);
    }

    // read to string
    let htmlString = await readFile(fileName);

    const onFinalFileComplete = (fileName: string, fileString: string) => {
      // write the file
      fs.writeFile(
        `${flags.outDir}/${fileName}.svelte`,
        fileString,
        function (err: any) {
          if (err) throw err;
        }
      );
    };

    // keep running until there are no more blocks
    while (true) {
      let { stringCopy, blocks } = run({
        prefix: flags.prefix,
        htmlString: htmlString as string,
        onFinalFileComplete,
      });
      let remainingBlocks = blocks.length;
      htmlString = stringCopy;
      if (remainingBlocks <= 0) break;
    }

    // get all nested component based on <[A-Z].* \/> regex
    const allTags: any[] = (htmlString as string).match(/<[A-Z].* \/>/g) ?? [];

    // add import statements for all the nested components
    let importString = "";
    for (let i = 0; i < allTags.length; i += 1) {
      const tag = allTags[i];
      const componentName = tag.slice(1, tag.length - 3);
      importString += `import ${componentName} from './${componentName}.svelte';\n`;
    }

    // build full file
    const fullFile = `<script>\n${importString}\n</script>\n${htmlString}\n\n<style>\n${""}\n</style>\n`;

    // write the top level file
    fs.writeFile(
      `${flags.outDir}/App.svelte`,
      fullFile as string,
      function (err: any) {
        if (err) throw err;
      }
    );

    cli.action.stop("done!");

    console.log(
      "✅ Looks like we did it!\n\n🚀 Check the build folder for your new Svelte components!\n\n🤘 Thanks for using html2svelte!"
    );
  }
}

ConvertCommand.description = "Convert a HTML file to Svelte Components";

ConvertCommand.args = [
  {
    name: "file",
    description: "html file to convert",
    required: false,
  },
];

ConvertCommand.hidden = false;

ConvertCommand.flags = {
  outDir: flags.string({
    char: "o",
    description: "folder to output the converted files to",
    default: "build",
  }),
  prefix: flags.string({
    char: "p",
    description: "prefix to used to determine which elements to convert",
    default: "comp_",
  }),
};

module.exports = ConvertCommand;

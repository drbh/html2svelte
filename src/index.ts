import fs from "fs";
import parser from "node-html-parser";
import process from "process";

const PREFIX = "comp_";

// read file
const readFile = (file: any) => {
  return new Promise((resolve, reject) => {
    fs.readFile(file, "utf8", (err: any, data: any) => {
      if (err) reject(err);
      else resolve(data);
    });
  });
};

// check if this is something we'll want to make a component out of
function hasClassAttribute(node: any) {
  return node.rawAttrs && node.rawAttrs.includes("class");
}

// split the html tree into blocks
function splitHTMLTree(root: any) {
  let results: any[] = [];
  let lastLevel = 0;

  // recursively process the tree
  function processNode(node: any, level = 0) {
    level++;
    let block = [{ level, node }];
    for (let child of node.childNodes) {
      let childBlocks = processNode(child, level);
      block = block.concat(childBlocks);
    }

    // if this is a block we want to make a component out of
    // then we should process it
    if (hasClassAttribute(node)) {
      // pull the class value out of the node
      const attrs = node.rawAttrs || "";
      const nodeClasses = attrs.match(/class="(.*)"/);
      if (!nodeClasses) return results;
      const classList = nodeClasses[1].split('" ');
      let actualClassName = classList[0];
      let newClassList = actualClassName.split(" ");
      let firstClassValue = newClassList[0];

      // prefix check and removal
      if (!firstClassValue.startsWith(PREFIX)) return results;
      firstClassValue = firstClassValue.slice(PREFIX.length);

      // add it back into the class list
      newClassList[0] = firstClassValue;

      // concat all the classes into a single string
      let componentName = newClassList
        .map((c: any) => c.replace(/-([a-z])/g, (g: any) => g[1].toUpperCase()))
        .join("_");

      // capitalize the first letter
      componentName = componentName[0].toUpperCase() + componentName.slice(1);

      const newComp = `<${componentName} />`;

      // extract values of interest (emphasis on start and end)
      let [start, end] = node.range;
      let range = end - start;

      const data = {
        level: level - 2,
        range,
        start,
        end,
        componentName,
        newComp,
        change: level - lastLevel,
        diff: range - newComp.length,
      };
      results.push(data);
    }

    return results;
  }

  const blocks = processNode(root);

  return blocks;
}

const run = (htmlString: string) => {
  let stringCopy = htmlString;
  // parse our html string into a DOM tree - include everything
  const htmlTree = parser.parse(htmlString, {
    lowerCaseTagName: true,
    comment: false,
    voidTag: {
      tags: [
        "area",
        "base",
        "br",
        "col",
        "embed",
        "hr",
        "img",
        "input",
        "link",
        "meta",
        "param",
        "source",
        "track",
        "wbr",
      ],
    },
    blockTextElements: {
      script: true,
      noscript: true,
      style: true,
      pre: true,
    },
  });

  let blocks = splitHTMLTree(htmlTree);

  // pop off the first block and update all other blocks accordingly based on if this
  // block is inside another block or not
  const firstBlock = blocks.shift();

  // update all other blocks
  for (let i = 0; i < blocks.length; i += 1) {
    const block = blocks[i];
    let isInside = firstBlock.start > block.start && firstBlock.end < block.end;

    if (isInside) {
      block.end -= firstBlock.diff;
    } else {
      block.start -= firstBlock.diff;
      block.end -= firstBlock.diff;
    }
  }

  // extract the html from the first block that we'll replace with a component
  const firstBlockString = stringCopy.substring(
    firstBlock.start,
    firstBlock.end
  );

  // get all nested component based on <[A-Z].* \/> regex
  const allTags: any[] = firstBlockString.match(/<[A-Z].* \/>/g) ?? [];

  // add import statements for all the nested components
  let importString = "";
  for (let i = 0; i < allTags.length; i += 1) {
    const tag = allTags[i];
    const componentName = tag.slice(1, tag.length - 3);
    importString += `import ${componentName} from './${componentName}.svelte';\n`;
  }

  // build full file
  const fullFile = `<script>\n${importString}\n</script>\n${firstBlockString}\n<style>\n${""}\n</style>\n`;

  // write the file
  fs.writeFile(
    `build/${firstBlock.componentName}.svelte`,
    fullFile,
    function (err: any) {
      if (err) throw err;
    }
  );

  // finally replace the html with the component tag
  stringCopy =
    stringCopy.substring(0, firstBlock.start) +
    firstBlock.newComp +
    stringCopy.substring(firstBlock.end, stringCopy.length);

  return { stringCopy, blocks };
};

async function main() {
  const args = process.argv.slice(2);
  const fileName = args[0];
  const file = `${fileName}`;

  // read to string
  let htmlString = await readFile(file);

  // keep running until there are no more blocks
  while (true) {
    let { stringCopy, blocks } = run(htmlString as string);
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
  fs.writeFile(`build/App.svelte`, fullFile as string, function (err: any) {
    if (err) throw err;
  });
}

main()
  .then(() => {
    console.log(
      "✅ Looks like we did it!\n\n🚀 Check the build folder for your new Svelte components!\n\n🤘 Thanks for using html2svelte!"
    );
  })
  .catch((err) => {
    console.log(err);
  });
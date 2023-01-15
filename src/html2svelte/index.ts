import parser from "node-html-parser";

// check if this is something we'll want to make a component out of
function hasClassAttribute(node: any) {
  return node.rawAttrs && node.rawAttrs.includes("class");
}

// split the html tree into blocks
export function splitHTMLTree(prefix: string, root: any) {
  let results: any[] = [];
  let lastLevel = 0;

  // recursively process the tree
  function processNode(prefix: string, node: any, level = 0) {
    level++;
    let block = [{ level, node }];
    for (let child of node.childNodes) {
      let childBlocks = processNode(prefix, child, level);
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
      if (!firstClassValue.startsWith(prefix)) return results;
      firstClassValue = firstClassValue.slice(prefix.length);

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

  const blocks = processNode(prefix, root);

  return blocks;
}

export const run = ({
  prefix,
  htmlString,
  onFinalFileComplete,
}: {
  prefix: string;
  htmlString: string;
  onFinalFileComplete: any;
}) => {
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

  let blocks = splitHTMLTree(prefix, htmlTree);

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

  onFinalFileComplete(firstBlock.componentName, fullFile);

  // finally replace the html with the component tag
  stringCopy =
    stringCopy.substring(0, firstBlock.start) +
    firstBlock.newComp +
    stringCopy.substring(firstBlock.end, stringCopy.length);

  return { stringCopy, blocks };
};

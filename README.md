# html2svelte

> Convert HTML to Svelte components in a snap

Svelte is pretty 🔥 and is a nice way to build web apps. This is a small tool that helps turn your HTML into Svelte components.

I especially like that its much easier to design/style an app, and then add logic. This is quite different than React, where you have to think about the logic/components first, and then build/style them.

There are a list of other "reasons why" you should use Svelte, but thats left as an exercise to the reader.

## 💥 TLDR;

Add `comp_` to the class names of your HTML elements and run `html2svelte` on your HTML files.

<img src="images/html2svelte.png">

## 🕹️ How to use

### 📦 Install from npm

```bash
# in progress (not published yet)
npm install -g html2svelte
```

### 🛠️ Build from source

```bash
git clone https://github.com/drbh/html2svelte.git
cd html2svelte
npm run bootstrap
# now you can run the tool
html2svelte convert assets/index.html
prettier --plugin-search-dir . build/*.svelte -w
```

1. clone this repo and install dependencies
2. copy an HTML file into the `assets/` folder (or use the one above)
3. run `npm run process`

## ⚙️ How it works

1. The script will look for all the HTML file based on the cli argument passed.
2. It parses the HTML and look for all the elements with a class name that starts with `comp_`.
3. Then it creates a Svelte component for each of those elements, and replace the HTML with the component, writing the new HTML to the `build/` folder.
4. `prettier` is run with the `svelte` plugin to format the final code.

## 🧠 Thoughts

- [ ] Currently relies on a fixed prefix for the class names. This could be changed to a cli argument, or with a config file.
- [ ] Currently this requires an operating system for things like `fs` and `prettier`. This should be to be compatible with the browser.
- [ ] Once browser compatibility this should be a simple web app that you can drag and drop your HTML files into.
- [ ] This could probably be extended to work with other frameworks like React, Vue, etc. if you wanna build out a more generic component generator.
- [ ] Maybe you should be able to reverse the process and turn Svelte components into HTML. This would be useful for sharing components with other people, and reimporting to design software.
- [ ] should publish on npm so its easier to use

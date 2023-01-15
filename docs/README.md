

## 👩‍💻 Build for web
```bash
# this will create an index.js in the bundle folder
node esbuild.js
```

Run a static server to see the site in action
```bash
# `npx http-server -p 9000` or `python3 -m http.server 9000`
python3 -m http.server 9000
```

open [http://127.0.0.1:9000/](http://127.0.0.1:9000/) and try adding/removing `comp_` from the class name of the `div`s. 

You should see the new Svelte Components appear in real time.
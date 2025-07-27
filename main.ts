import { Application } from "jsr:@oak/oak/application";
import { Router } from "jsr:@oak/oak/router";
import * as toml from "https://deno.land/std@0.224.0/toml/mod.ts";

const router = new Router();
const registry = JSON.parse(Deno.readTextFileSync("./registry.json"));

interface PluginInfo {
    name: string,
    author: string,
    version: string,
    license: string
}

function parsePluginInfo(tomlContent: string): PluginInfo {
  const parsed = toml.parse(tomlContent);

  const pluginInfo: PluginInfo = {
    name: parsed.name as string,
    author: parsed.author as string,
    version: parsed.version as string,
    license: parsed.license as string,
  };

  return pluginInfo;
}

//Pages
const index_page = Deno.readTextFileSync("./index.html");
const plugin_page = Deno.readTextFileSync("./plugin.html");

router.get("/api/repo/:plugin", (ctx) => {
	if(registry.hasOwnProperty(ctx.params.plugin)){
        ctx.response.body = registry[ctx.params.plugin];
    }
    else{
		ctx.response.body = `404`;
    }
});

async function getManifestContent(repoUrl: string): Promise<string> {
  try {
    const url = new URL(repoUrl);

    if (url.hostname.includes("github.com")) {
      const match = repoUrl.match(/^https:\/\/github\.com\/([^\/]+)\/([^\/]+)(\.git)?$/);
      if (!match) throw new Error("Invalid GitHub repository URL");

      const owner: string = match[1];
      const repo: string = match[2].replace(/\.git$/, "");
      const branches: string[] = ["main", "master"];

      for (const branch of branches) {
        const rawUrl: string = `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/manifest.toml`;
        const response: Response = await fetch(rawUrl);
        if (response.ok) return await response.text();
      }

      return "The repo does not have a manifest.toml file";
    }

    // For non-GitHub URLs, attempt to fetch manifest.toml from known raw paths
    const branches = ["main", "master"];
    for (const branch of branches) {
      const potentialPaths = [
        `${repoUrl.replace(/\.git$/, '')}/raw/${branch}/manifest.toml`,
        `${repoUrl.replace(/\.git$/, '')}/-/raw/${branch}/manifest.toml` // for GitLab
      ];

      for (const path of potentialPaths) {
        try {
          const response: Response = await fetch(path);
          if (response.ok) return await response.text();
        } catch (_) {
          // ignore and try next
        }
      }
    }

    return "The repo does not have a manifest.toml file";
  } catch (error) {
    console.error(error);
    return "The repo does not have a manifest.toml file";
  }
}

async function getReadmeContent(repoUrl: string): Promise<string> {
  try {
    const url = new URL(repoUrl);

    if (url.hostname.includes("github.com")) {
      const match = repoUrl.match(/^https:\/\/github\.com\/([^\/]+)\/([^\/]+)(\.git)?$/);
      if (!match) throw new Error("Invalid GitHub repository URL");

      const owner: string = match[1];
      const repo: string = match[2].replace(/\.git$/, "");
      const branches: string[] = ["main", "master"];

      for (const branch of branches) {
        const rawUrl: string = `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/README.md`;
        const response: Response = await fetch(rawUrl);
        if (response.ok) return await response.text();
      }

      return "The repo does not have a README";
    }

    // For non-GitHub URLs, attempt to fetch README.md from known raw paths
    const branches = ["main", "master"];
    for (const branch of branches) {
      const potentialPaths = [
        `${repoUrl.replace(/\.git$/, '')}/raw/${branch}/README.md`,
        `${repoUrl.replace(/\.git$/, '')}/-/raw/${branch}/README.md` // for GitLab
      ];

      for (const path of potentialPaths) {
        try {
          const response: Response = await fetch(path);
          if (response.ok) return await response.text();
        } catch (_) {
          // ignore and try next
        }
      }
    }

    return "The repo does not have a README";
  } catch (error) {
    console.error(error);
    return "The repo does not have a README";
  }
}

router.get("/api/readme/:plugin", async (ctx) => {
	if(registry.hasOwnProperty(ctx.params.plugin)){
        ctx.response.body = await getReadmeContent(registry[ctx.params.plugin]);
    }
    else{
		ctx.response.body = `Server error, the repo does not exist`;
    }
})

router.get("/api/info/:plugin", async (ctx) => {
	if(registry.hasOwnProperty(ctx.params.plugin)){
        ctx.response.body = parsePluginInfo(await getManifestContent(registry[ctx.params.plugin]));
    }
    else{
		ctx.response.body = `Server error, the repo does not exist`;
    }
})

function searchPlugins(query) {
	const matchingKeys = Object.keys(registry).filter(key => key.includes(query));
	return matchingKeys;
}

router.get("/api/search/:query", (ctx) => {
	ctx.response.body = JSON.stringify(searchPlugins(ctx.params.query));
})

router.get("/", (ctx) => {
	ctx.response.body = index_page;  
})

router.get("/plugin/:name", (ctx) => {
	ctx.response.body = plugin_page.replace("{plugin_name}",ctx.params.name);  
})

const app = new Application();
app.use(router.routes());
app.use(router.allowedMethods());

app.listen({ port: 8080 });
console.log("Listening on port 8080");

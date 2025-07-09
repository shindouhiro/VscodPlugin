// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
// 依赖 sharp 实现 SVG 转 PNG base64
import sharp from 'sharp';

let iconsCache: Record<string, { body: string; width?: number; height?: number }> = {};

function loadIcons(context: vscode.ExtensionContext): Record<string, { body: string; width?: number; height?: number }> {
  if (Object.keys(iconsCache).length > 0) {return iconsCache;}
  // 兼容打包后out目录和开发时src目录
  let iconsPath = path.join(context.extensionPath, 'out', 'my-icons.json');
  if (!fs.existsSync(iconsPath)) {
    iconsPath = path.join(context.extensionPath, 'src', 'my-icons.json');
  }
  
  console.log('加载图标文件路径:', iconsPath);
  try {
    const raw = fs.readFileSync(iconsPath, 'utf-8');
    const json = JSON.parse(raw);
    iconsCache = json.icons || {};
    console.log('成功加载图标数量:', Object.keys(iconsCache).length);
    return iconsCache;
  } catch (e) {
    console.error('Failed to load my-icons.json from', iconsPath, e);
    return {};
  }
}

// 异步工具函数：SVG转PNG base64 data URI
async function svgToPngBase64DataUrl(icon: { body: string; width?: number; height?: number }, key: string): Promise<string> {
  const width = icon.width || 16;
  const height = icon.height || 16;
  const svg = `<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"${width}\" height=\"${height}\" viewBox=\"0 0 ${width} ${height}\" fill=\"currentColor\" aria-label=\"${key}\">${icon.body}</svg>`;
  const pngBuffer = await sharp(Buffer.from(svg)).png().toBuffer();
  const base64 = pngBuffer.toString('base64');
  return `data:image/png;base64,${base64}`;
}

export function activate(context: vscode.ExtensionContext) {
  console.log('extension activated');
  const icons = loadIcons(context);
  const hoverProvider = vscode.languages.registerHoverProvider(
    [
      { language: 'html', scheme: 'file' },
      { language: 'vue', scheme: 'file' }
    ],
    {
      provideHover: async function(document, position, token) {
        const range = document.getWordRangeAtPosition(position, /[\w\-]+/);
        if (!range) {return;}
        const line = document.lineAt(position.line).text;
        const classAttrMatch = line.match(/class\s*=\s*(["'])(.*?)\1/);
        if (!classAttrMatch) {return;}
        const classList = classAttrMatch[2].split(/\s+/);
        const iconClasses = classList.filter(cls => cls.startsWith('my-icons-'));
        if (iconClasses.length === 0) {return;}
        const md = new vscode.MarkdownString();
        md.supportHtml = true;
        md.isTrusted = true;
        for (const cls of iconClasses) {
          const key = cls.replace('my-icons-', '');
          const icon = icons[key];
          if (!icon) {
            md.appendMarkdown(`**${cls}** - 图标未找到\n`);
            continue;
          }
          // --- SVG转PNG base64 data URI ---
          const pngLogoUri = await svgToPngBase64DataUrl(icon, key);
          // --- 推荐方案：VSCode hover下用PNG base64实现预览 ---
          md.appendMarkdown(`<img src=\"${pngLogoUri}\" width=\"${icon.width||100}\" height=\"${icon.height||0}\" style=\"vertical-align:middle;\"/>\n`);
        }
        return new vscode.Hover(md, range);
      }
    }
  );
  context.subscriptions.push(hoverProvider);
}

export function deactivate() {}

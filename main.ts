/**
 * Obsidian Blueprint Renderer Plugin
 * 
 * This plugin renders Unreal Engine Blueprint nodes as interactive visual diagrams in Obsidian.
 * 
 * @license MIT
 * @author goderyu
 * 
 * Third-party components:
 * - lib/render.js and lib/render.css are from BlueprintUE Self-Hosted Edition
 * - Original project: https://github.com/blueprintue/blueprintue-self-hosted-edition
 * - License: MIT License
 * - Copyright: © BlueprintUE Contributors
 */

import { Plugin } from 'obsidian';

// 声明原始工程的全局对象
// Global object declaration from BlueprintUE Self-Hosted Edition
declare global {
    interface Window {
        blueprintUE: {
            render: {
                Main: any;
            };
        };
    }
}

export default class BlueprintPlugin extends Plugin {
	private renderers: Map<HTMLElement, any> = new Map();

	async onload() {
		console.log('Loading Blueprint Plugin...');
		
		// 动态加载原始工程的CSS和JS
		await this.loadRenderAssets();
		
		// 注册蓝图代码块处理器
		this.registerMarkdownCodeBlockProcessor('blueprint', (source, el, ctx) => {
			this.renderBlueprint(source, el);
		});
		
		console.log('Blueprint Plugin loaded successfully');
	}

	onunload() {
		console.log('Unloading Blueprint Plugin...');
		
		// 清理所有渲染器
		this.renderers.forEach((renderer, element) => {
			try {
				if (renderer && typeof renderer.stop === 'function') {
					renderer.stop();
				}
			} catch (error) {
				console.error('Error stopping renderer:', error);
			}
		});
		this.renderers.clear();
		
		// 清理动态加载的样式
		const existingStyle = document.getElementById('blueprint-render-css');
		if (existingStyle) {
			existingStyle.remove();
		}
	}

	private async loadRenderAssets(): Promise<void> {
		return new Promise(async (resolve, reject) => {
			try {
				const adapter = this.app.vault.adapter;
				const pluginPath = `${this.app.vault.configDir}/plugins/${this.manifest.id}`;
				
				// 1. 加载CSS
				await this.loadRenderCSS(adapter, pluginPath);
				
				// 2. 加载JS
				await this.loadRenderScript(adapter, pluginPath);
				
				resolve();
			} catch (error) {
				console.error('Failed to load render assets:', error);
				reject(error);
			}
		});
	}

	private async loadRenderCSS(adapter: any, pluginPath: string): Promise<void> {
		// 检查是否已经加载
		if (document.getElementById('blueprint-render-css')) {
			return;
		}

		const renderCssPath = `${pluginPath}/lib/render.css`;
		console.log('Loading render.css from:', renderCssPath);
		
		try {
			const cssContent = await adapter.read(renderCssPath);
			
			// 创建style元素并添加到head
			const style = document.createElement('style');
			style.id = 'blueprint-render-css';
			style.textContent = cssContent;
			document.head.appendChild(style);
			
			console.log('Blueprint render CSS loaded successfully');
		} catch (error) {
			console.error('Failed to load render.css:', error);
			throw new Error(`Failed to load blueprint render CSS: ${error.message}`);
		}
	}

	private async loadRenderScript(adapter: any, pluginPath: string): Promise<void> {
		// 检查是否已经加载
		if (window.blueprintUE?.render?.Main) {
			return;
		}

		const renderJsPath = `${pluginPath}/lib/render.js`;
		console.log('Loading render.js from:', renderJsPath);
		
		try {
			const scriptContent = await adapter.read(renderJsPath);
			
			// 创建script元素并执行
			const script = document.createElement('script');
			script.textContent = scriptContent;
			document.head.appendChild(script);
			
			if (window.blueprintUE?.render?.Main) {
				console.log('Blueprint render script loaded successfully');
			} else {
				throw new Error('Blueprint render script loaded but Main class not found');
			}
		} catch (error) {
			console.error('Failed to load render.js:', error);
			throw new Error(`Failed to load blueprint render script: ${error.message}`);
		}
	}

	private renderBlueprint(source: string, container: HTMLElement): void {
		try {
			// 清理容器
			container.empty();
			
			// 创建渲染容器
			const renderContainer = container.createDiv({
				cls: 'blueprint-render-container'
			});
			
			// 设置容器样式
			renderContainer.style.cssText = `
				width: 100%;
				height: 600px;
				border: 1px solid var(--background-modifier-border);
				border-radius: 6px;
				overflow: hidden;
				background: var(--background-primary);
			`;
			
			// 使用原始工程的Main类进行渲染
			if (!window.blueprintUE?.render?.Main) {
				renderContainer.createDiv({
					text: 'Blueprint renderer not loaded. Please reload the plugin.',
					cls: 'blueprint-error'
				});
				return;
			}
			
			// 初始化渲染器
			const renderer = new window.blueprintUE.render.Main(
				source.trim(),
				renderContainer,
				{
					height: '600px',
					type: 'blueprint'
				}
			);
			
			// 启动渲染
			renderer.start((success: boolean, error: any) => {
				if (!success) {
					console.error('Blueprint rendering failed:', error);
					renderContainer.empty();
					renderContainer.createDiv({
						text: `Blueprint rendering failed: ${error?.displayedMessage || error?.message || 'Unknown error'}`,
						cls: 'blueprint-error'
					});
				} else {
					console.log('Blueprint rendered successfully');
				}
			});
			
			// 保存渲染器引用以便清理
			this.renderers.set(renderContainer, renderer);
			
		} catch (error) {
			console.error('Error rendering blueprint:', error);
			container.empty();
			container.createDiv({
				text: `Error: ${error.message}`,
				cls: 'blueprint-error'
			});
		}
	}
} 
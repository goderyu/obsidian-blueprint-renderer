/**
 * Blueprint Renderer Plugin
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

import { Plugin, MarkdownRenderChild, MarkdownPostProcessorContext } from 'obsidian';

// 导入render.js作为文本
// @ts-ignore - esbuild will handle this as text import
import renderJsCode from './lib/render.js';
import { createHash } from 'crypto';

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


export default class ObsidianBlueprintRenderer extends Plugin {
	renderers: Map<string, MarkdownBlueprintRender>
	async onload() {
		this.renderers = new Map
		// 执行render.js代码来初始化BlueprintUE
		this.initializeBlueprintUE();

		// 注册代码块处理器
		this.registerMarkdownCodeBlockProcessor('blueprint', (source: string, el: HTMLElement, ctx: MarkdownPostProcessorContext) => {
			this.renderBlueprint(source, el, ctx);
		});
	}

	onunload() {
		this.renderers.forEach((render: MarkdownBlueprintRender) => {
			render.unload()
		})
		this.renderers.clear();

		if (window.blueprintUE) {
			delete window.blueprintUE
		}
	}

	/**
	 * 初始化BlueprintUE渲染引擎
	 */
	private initializeBlueprintUE() {
		try {
			// 执行render.js代码
			const script = new Function(renderJsCode);
			script();

			// 验证BlueprintUE是否正确初始化
			if (!window.blueprintUE || !window.blueprintUE.render || !window.blueprintUE.render.Main) {
				throw new Error('BlueprintUE render engine failed to initialize');
			}

		} catch (error) {
			console.error('Failed to initialize BlueprintUE render engine:', error);
			throw error;
		}
	}

	/**
	 * 渲染蓝图代码块
	 */
	private renderBlueprint(source: string, el: HTMLElement, ctx: MarkdownPostProcessorContext) {
		// 生成唯一ID
		const rendererId = `blueprint-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
		// 创建RenderChild
		let blueprintRenderer = new MarkdownBlueprintRender(el, source, rendererId)
		blueprintRenderer.register(() => {
			this.renderers.delete(blueprintRenderer.id)
		})
		ctx.addChild(blueprintRenderer)
		// 存储渲染器实例
		this.renderers.set(rendererId, blueprintRenderer);
	}
}

export class MarkdownBlueprintRender extends MarkdownRenderChild {
	renderer: any
	source: string
	id: string

	constructor(containerEl: HTMLElement, source: string, id: string) {
		super(containerEl)
		this.source = source.trim()
		this.id = id
	}

	onload(): void {
		// 创建渲染器实例
		this.renderer = new window.blueprintUE.render.Main(
			this.source,
			this.containerEl,
			{
				height: '400px',
				type: 'blueprint'
			}
		);

		try {
			// 清理元素内容
			this.containerEl.empty();

			// 创建渲染容器
			const container = this.containerEl.createDiv();
			container.addClass('blueprint-container');

			// 启动渲染器
			this.renderer.start((success: boolean, error: any) => {
				if (!success) {
					console.error('Blueprint rendering failed:', error);
					container.empty();
					container.createDiv({
						text: `Blueprint rendering failed: ${error?.displayedMessage || error?.message || 'Unknown error'}`,
						cls: 'blueprint-error'
					});
				} else {
				}
			});

		} catch (error) {
			console.error('Error creating blueprint renderer:', error);
			this.containerEl.empty();
			this.containerEl.createDiv({
				text: `Error: ${error.message}`,
				cls: 'blueprint-error'
			});
		}
	}

	onunload(): void {
		try {
			if (this.renderer && typeof this.renderer.stop === 'function') {
				this.renderer.stop();
				console.debug("Blueprint Renderer onunload")
			}
		} catch (error) {
			console.error(`Error stopping renderer:`, error);
		}
	}
}
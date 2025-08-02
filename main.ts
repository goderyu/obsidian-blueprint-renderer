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

import { Plugin, MarkdownRenderChild, MarkdownPostProcessorContext, PluginSettingTab, App, Setting } from 'obsidian';

// 导入render.js作为文本
// @ts-ignore - esbuild will handle this as text import
import renderJsCode from './lib/render.js';
import { createHash } from 'crypto';

// 插件设置接口
interface BlueprintRendererSettings {
	minHeight: number;
	maxHeight: number;
	defaultHeight: number;
}

// 默认设置
const DEFAULT_SETTINGS: BlueprintRendererSettings = {
	minHeight: 200,
	maxHeight: 800,
	defaultHeight: 400
};

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
	settings: BlueprintRendererSettings;

	async onload() {
		// 加载设置
		await this.loadSettings();

		// 执行render.js代码来初始化BlueprintUE
		this.initializeBlueprintUE();

		// 注册代码块处理器
		this.registerMarkdownCodeBlockProcessor('blueprint', (source: string, el: HTMLElement, ctx: MarkdownPostProcessorContext) => {
			this.renderBlueprint(source, el, ctx);
		});

		// 添加设置面板
		this.addSettingTab(new BlueprintRendererSettingTab(this.app, this));
	}

	onunload() {
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
	 * 加载插件设置
	 */
	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	/**
	 * 保存插件设置
	 */
	async saveSettings() {
		await this.saveData(this.settings);
	}

	/**
	 * 渲染蓝图代码块
	 */
	private renderBlueprint(source: string, el: HTMLElement, ctx: MarkdownPostProcessorContext) {
		// 生成唯一ID
		const rendererId = `blueprint-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
		// 创建RenderChild
		let blueprintRenderer = new MarkdownBlueprintRender(el, source, rendererId, this.settings, this)
		ctx.addChild(blueprintRenderer)
	}
}

export class MarkdownBlueprintRender extends MarkdownRenderChild {
	renderer: any
	source: string
	id: string
	settings: BlueprintRendererSettings
	plugin: ObsidianBlueprintRenderer

	constructor(containerEl: HTMLElement, source: string, id: string, settings: BlueprintRendererSettings, plugin: ObsidianBlueprintRenderer) {
		super(containerEl)
		this.source = source.trim()
		this.id = id
		this.settings = settings
		this.plugin = plugin
	}

	onload(): void {
		try {
			// 清理元素内容
			this.containerEl.empty();

			// 创建渲染容器
			const container = this.containerEl.createDiv();
			container.addClass('blueprint-container');
			
			// 设置初始高度（宽度保持100%）
			container.style.height = `${this.settings.defaultHeight}px`;
			
			// 创建拖拽调整手柄
			this.createResizeHandle(container);

			// 创建渲染器实例，使用container作为渲染目标
			this.renderer = new window.blueprintUE.render.Main(
				this.source,
				container, // 使用我们创建的container而不是this.containerEl
				{
					height: `${this.settings.defaultHeight}px`,
					type: 'blueprint'
				}
			);

			// 启动渲染器
			this.renderer.start((success: boolean, error: any) => {
				if (!success) {
					console.error('Blueprint rendering failed:', error);
					container.empty();
					// 创建拖拽手柄（因为container被清空了）
					this.createResizeHandle(container);
					container.createDiv({
						text: `Blueprint rendering failed: ${error?.displayedMessage || error?.message || 'Unknown error'}`,
						cls: 'blueprint-error'
					});
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

	/**
	 * 创建拖拽调整手柄
	 */
	private createResizeHandle(container: HTMLElement): void {
		const resizeHandle = container.createDiv();
		resizeHandle.addClass('blueprint-resize-handle');

		let isResizing = false;
		let startY = 0;
		let startHeight = 0;

		const onMouseDown = (e: MouseEvent) => {
			isResizing = true;
			startY = e.clientY;
			startHeight = parseInt(getComputedStyle(container, null).getPropertyValue('height'));
			
			document.addEventListener('mousemove', onMouseMove);
			document.addEventListener('mouseup', onMouseUp);
			e.preventDefault();
		};

		const onMouseMove = (e: MouseEvent) => {
			if (!isResizing) return;
			
			const height = startHeight + e.clientY - startY;
			
			// 使用配置中的最小和最大高度限制
			if (height >= this.settings.minHeight && height <= this.settings.maxHeight) {
				container.style.height = height + 'px';
			}
		};

		const onMouseUp = () => {
			if (isResizing) {
				isResizing = false;
				document.removeEventListener('mousemove', onMouseMove);
				document.removeEventListener('mouseup', onMouseUp);
				
				// 保存新的尺寸到设置中
				this.saveContainerSize(container);
			}
		};

		resizeHandle.addEventListener('mousedown', onMouseDown);
	}

	/**
	 * 保存容器尺寸到插件设置
	 */
	private async saveContainerSize(container: HTMLElement): Promise<void> {
		try {
			const height = parseInt(getComputedStyle(container, null).getPropertyValue('height'));
			
			// 更新插件设置中的默认高度
			this.plugin.settings.defaultHeight = height;
			await this.plugin.saveSettings();
		} catch (error) {
			console.error('Failed to save container size:', error);
		}
	}

	onunload(): void {
		try {
			if (this.renderer && typeof this.renderer.stop === 'function') {
				this.renderer.stop();
			}
		} catch (error) {
			console.error(`Error stopping renderer:`, error);
		}
	}
}

/**
 * 插件设置面板
 */
class BlueprintRendererSettingTab extends PluginSettingTab {
	plugin: ObsidianBlueprintRenderer;

	constructor(app: App, plugin: ObsidianBlueprintRenderer) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const {containerEl} = this;

		containerEl.empty();

		containerEl.createEl('h2', {text: 'Blueprint Renderer Settings'});

		new Setting(containerEl)
			.setName('Default Height')
			.setDesc('Default height for blueprint containers (pixels)')
			.addText(text => text
				.setPlaceholder('400')
				.setValue(this.plugin.settings.defaultHeight.toString())
				.onChange(async (value) => {
					const numValue = parseInt(value);
					if (!isNaN(numValue) && numValue >= this.plugin.settings.minHeight && numValue <= this.plugin.settings.maxHeight) {
						this.plugin.settings.defaultHeight = numValue;
						await this.plugin.saveSettings();
					}
				}));

		new Setting(containerEl)
			.setName('Minimum Height')
			.setDesc('Minimum height for blueprint containers (pixels)')
			.addText(text => text
				.setPlaceholder('200')
				.setValue(this.plugin.settings.minHeight.toString())
				.onChange(async (value) => {
					const numValue = parseInt(value);
					if (!isNaN(numValue) && numValue > 0 && numValue <= this.plugin.settings.maxHeight) {
						this.plugin.settings.minHeight = numValue;
						await this.plugin.saveSettings();
					}
				}));

		new Setting(containerEl)
			.setName('Maximum Height')
			.setDesc('Maximum height for blueprint containers (pixels)')
			.addText(text => text
				.setPlaceholder('800')
				.setValue(this.plugin.settings.maxHeight.toString())
				.onChange(async (value) => {
					const numValue = parseInt(value);
					if (!isNaN(numValue) && numValue >= this.plugin.settings.minHeight) {
						this.plugin.settings.maxHeight = numValue;
						await this.plugin.saveSettings();
					}
				}));
	}
}
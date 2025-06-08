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

// 导入render.js作为文本
// @ts-ignore - esbuild will handle this as text import
import renderJsCode from './lib/render.js';

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

// 渲染器实例映射
const rendererInstances = new Map<string, any>();

export default class ObsidianBlueprintRenderer extends Plugin {
	async onload() {
		console.log('Loading Obsidian Blueprint Renderer Plugin');
		
		// 执行render.js代码来初始化BlueprintUE
		this.initializeBlueprintUE();
		
		// 注册代码块处理器
		this.registerMarkdownCodeBlockProcessor('blueprint', (source, el, ctx) => {
			this.renderBlueprint(source, el, ctx);
		});
		
		console.log('Obsidian Blueprint Renderer Plugin loaded successfully');
	}

	onunload() {
		console.log('Unloading Obsidian Blueprint Renderer Plugin');
		
		// 清理所有渲染器实例
		rendererInstances.forEach((renderer, key) => {
			try {
				if (renderer && typeof renderer.stop === 'function') {
					renderer.stop();
				}
			} catch (error) {
				console.error(`Error stopping renderer ${key}:`, error);
			}
		});
		rendererInstances.clear();
		
		console.log('Obsidian Blueprint Renderer Plugin unloaded');
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
			
			console.log('BlueprintUE render engine initialized successfully');
		} catch (error) {
			console.error('Failed to initialize BlueprintUE render engine:', error);
			throw error;
		}
	}

	/**
	 * 渲染蓝图代码块
	 */
	private renderBlueprint(source: string, el: HTMLElement, ctx: any) {
		// 生成唯一ID
		const rendererId = `blueprint-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
		
		try {
			// 清理元素内容
			el.empty();
			
			// 创建渲染容器
			const container = el.createDiv();
			container.addClass('blueprint-container');
			
			// 创建渲染器实例
			const renderer = new window.blueprintUE.render.Main(
				source.trim(),
				container,
				{
					height: '400px',
					type: 'blueprint'
				}
			);
			
			// 存储渲染器实例
			rendererInstances.set(rendererId, renderer);
			
			// 启动渲染器
			renderer.start((success: boolean, error: any) => {
				if (!success) {
					console.error('Blueprint rendering failed:', error);
					container.empty();
					container.createDiv({
						text: `Blueprint rendering failed: ${error?.displayedMessage || error?.message || 'Unknown error'}`,
						cls: 'blueprint-error'
					});
				} else {
					console.log('Blueprint rendered successfully');
				}
			});
			
		} catch (error) {
			console.error('Error creating blueprint renderer:', error);
			el.empty();
			el.createDiv({
				text: `Error: ${error.message}`,
				cls: 'blueprint-error'
			});
		}
	}
} 
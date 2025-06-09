# Obsidian Blueprint Renderer

> 我该如何在Markdown笔记中记录我的UE蓝图代码？截一张图很麻烦，就不能将蓝图代码复制过来粘贴在代码块中，然后渲染成蓝图图表吗？

好的，现在你可以了

![Preview](https://raw.githubusercontent.com/goderyu/obsidian-blueprint-renderer/refs/heads/main/resources/preview.gif)

这是一个用于在Obsidian中渲染Unreal Engine蓝图节点可视化界面的插件。

## 架构说明

本插件采用**简化架构**，直接基于原始BlueprintUE工程的单文件系统：


### 核心特性

- ✅ **100%兼容性**：直接使用原始工程的render.js和render.css
- ✅ **零重构风险**：避免了复杂的TypeScript重构
- ✅ **完整功能**：支持所有节点类型、连线、交互功能
- ✅ **轻量级**：main.js仅5.9KB，大幅简化
- ✅ **易维护**：架构简单，易于理解和维护

### 工作原理

1. **动态加载**：使用fetch加载原始render.js并执行
2. **全局暴露**：原始工程通过`window.blueprintUE.render.Main`暴露主类
3. **简单包装**：main.ts创建最小包装器，处理Obsidian集成
4. **样式隔离**：使用CSS作用域确保不与Obsidian样式冲突

### 使用方法

在Obsidian中创建代码块：

````markdown
```blueprint
Begin Object Class=/Script/BlueprintGraph.K2Node_Event Name="K2Node_Event_0"
   EventReference=(MemberName="BeginPlay")
   NodePosX=0
   NodePosY=0
   NodeGuid=A1B2C3D4-E5F6-7890-ABCD-EF1234567890
   CustomProperties Pin (PinId=12345678-90AB-CDEF-1234-567890ABCDEF,PinName="exec",Direction="EGPD_Output",PinType.PinCategory="exec")
End Object

Begin Object Class=/Script/BlueprintGraph.K2Node_CallFunction Name="K2Node_CallFunction_0"
   FunctionReference=(MemberName="Print String")
   NodePosX=300
   NodePosY=0
   NodeGuid=B2C3D4E5-F6G7-8901-BCDE-F12345678901
   CustomProperties Pin (PinId=23456789-01BC-DEF1-2345-6789ABCDEF01,PinName="exec",Direction="EGPD_Input",PinType.PinCategory="exec",LinkedTo=(K2Node_Event_0 12345678-90AB-CDEF-1234-567890ABCDEF,))
   CustomProperties Pin (PinId=45678901-23DE-F123-4567-89ABCDEF0123,PinName="In String",Direction="EGPD_Input",PinType.PinCategory="string",DefaultValue="Hello World!")
End Object
```
````

### 构建

```bash
npm install
npm run build
```

## 许可证和归属

### 本插件许可证
本插件采用MIT许可证发布。

### 第三方组件归属
本插件使用了来自 [BlueprintUE Self-Hosted Edition](https://github.com/blueprintue/blueprintue-self-hosted-edition) 项目的渲染引擎代码：

- `lib/render.js` - 蓝图渲染引擎
- `lib/render.css` - 蓝图样式表

**原始项目信息：**
- 项目：BlueprintUE Self-Hosted Edition
- 仓库：https://github.com/blueprintue/blueprintue-self-hosted-edition
- 许可证：MIT License
- 版权：© BlueprintUE Contributors

根据MIT许可证条款，我们保留了原始版权声明，并在此明确归属。感谢BlueprintUE项目团队提供的优秀渲染引擎。

### 兼容性声明

本项目完全兼容并遵守BlueprintUE Self-Hosted Edition项目的MIT许可证条款。所有使用的代码均已正确归属，并保持了原始许可证要求。 

## 移动端支持

### 移动端限制

- 移动端目前图表交互和Obsidian原始交互会有一定冲突


## 捐助

如果您觉得此插件有用，并希望支持其开发，您可以在 Ko-fi 上支持我。

[![ko-fi](https://ko-fi.com/img/githubbutton_sm.svg)](https://ko-fi.com/goderyu)
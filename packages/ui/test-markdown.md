# Enhanced Markdown Renderer Test

This is a test of the new **Markdown-it** powered TMarkdownRenderer component.

## Features

### Basic Formatting
- **Bold text**
- *Italic text*
- ***Bold and italic***
- ~~Strikethrough~~
- ==Highlighted text== (using markdown-it-mark)

### Emojis :rocket:
The component now supports emojis! :smile: :heart: :thumbsup:

### Links
- [Internal Link](/about)
- [External Link](https://example.com)
- Auto-linked: https://google.com

### Code
Inline code: `const message = "Hello World"`

```javascript
// Code block with syntax highlighting
function greet(name) {
  return `Hello, ${name}!`;
}
```

### Tables

| Feature | Status | Notes |
|---------|--------|-------|
| Headers | ✅ | Auto-anchors |
| Tables | ✅ | With striped rows |
| Emojis | ✅ | Full support |
| Footnotes | ✅ | See below[^1] |

### Lists

1. Ordered item 1
2. Ordered item 2
   - Nested unordered
   - Another nested
3. Ordered item 3

### Task Lists
- [x] Completed task
- [ ] Uncompleted task
- [x] Another completed task

### Blockquotes

> This is a blockquote with enhanced styling.
> It spans multiple lines.

### Footnotes

This text has a footnote[^1].

And here's another one[^2].

[^1]: This is the first footnote.
[^2]: This is the second footnote with more text.

### Typography

"Smart quotes" and 'apostrophes' are handled automatically.

En-dash -- and em-dash --- are converted properly.

... becomes an ellipsis.

### Horizontal Rule

---

That's all the enhanced features!
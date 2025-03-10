# 北京大学教学网自动下载

这个项目实现北京大学教学网教学内容页面内容的自动下载，可以帮助自动下载教学网上教学内容中的讲义等。

> [!IMPORTANT]
> 使用时请注意遵守学校有关规定

## 特征

### 1. 自动下载与命名
- 支持自动下载页面中的文件和文件夹资源。
- 下载后，文件和文件夹将按照教学网上的标注名称进行命名，并根据文件的实际类型（通过请求文件头判断）自动添加正确的扩展名（如 `.pdf`、`.docx` 等）。

> [!TIP]
> 需要注意的是，对于 `pptx` ， `docx` ， `xsl` 等文件类型，其实际上是 `zip` 类型，因而通过文件头难以获得其扩展名，我们对其与其他的 `zip` 类型文件采用的是下载后重命名的方式确定其扩展名。

### 2. 模拟登录与手动 Cookie 支持
- 提供自动模拟登录功能，方便用户快速访问受保护的资源。
- 出于安全性考虑，自动模拟登录功能需由用户手动开启。
- 同时支持用户手动获取并输入 Cookie，以便在需要时自行管理登录状态。

### 3. 增量下载机制
- 支持增量下载功能，避免重复下载已存在的资源。
- 增量下载的判断依据为文件是否存在，而不考虑文件是否更新。具体表现为：
  - 如果本地已存在同名文件（如 `file.pdf`），而教学网上的同名文件已更新，则跳过下载，保留本地版本。

## 安装依赖

安装 `Node.js` ，具体访问[这个页面](https://nodejs.org/en/download)。然后进入项目根目录，执行

```bash
npm i
```

## 获取 Cookie

项目提供两种方法获取 Cookie ，分别是浏览器登陆教学网获取，或者使用项目提供的方法自动获取，从便利的角度我们推荐第二种，但从安全的角度我们保留了第一种方法，因为第二种方法需要在本地用文件形式存储你的密码，如果你下载有危险的软件或电脑被窃取，可能会导致你的密码泄漏。第二种方法默认不启用，除非你在[config/info.json](./config/info.json)写入你的学号和密码。

> [!CAUTION]
> 请妥善保管你的密码和 Cookie

### 自动获取 Cookie

项目可以通过自动模拟登陆教学网获取 Cookie 并写入文件以实现，为了使用这一功能，你需要在[config/info.json](./config/info.json)中写入你的学号和密码，如果不想启用这一功能，可以保持为空字符串。

> [!TIP]
> 当找不到用户制定的的 Cookie 文件或者 Cookie 可能过期（判断是否找到链接，找不到可下载的链接则判断为 Cookie 可能过期）时会自动尝试自动获取 Cookie 。如果不想启用这一功能，可以保持[config/info.json](./config/info.json)中的学号和密码为空字符串。

> [!CAUTION]
> 选择输入学号和密码以启用这部分功能之前，务必考虑风险，项目在本地运行，我们不会收集你的学号和密码，但你需要确保没有流氓软件会窃取你的密码，或者你的电脑如果丢失你的密码同样可能泄漏。

### 浏览器登陆教学网获取 Cookie

从教学网获取链接和下载文件需要 Cookie ，可以在浏览器登陆[北京大学教学网](https://course.pku.edu.cn)，然后进入控制台的网络选项，再刷新页面，找到第一个链接，其请求头的 Cookie 即为我们需要的 Cookie 。以[Firefox浏览器](https://www.mozilla.org/en-US/firefox/)为例，登陆后可以按下 F12 ，看到的应该如下图

![console](images/console.png)

点击 Network 选项卡

![network-option](images/network-option.png)

应该看到如下图

![network-not-refresh](images/network-not-refresh.png)

刷新（可以按 F5 ），应该看到如下图

![network-fresh](images/network-fresh.png)

向上滑动找到第一个链接，应该看到如下图

![network-first](images/network-first.png)

点击其，应该看到如下图

![network-headers](images/network-headers.png)

点击右侧 Headers 选项卡，下拉找到请求头的 Cookie ，应该如下图

![network-cookie](images/network-cookie.png)

右键选择拷贝值，然后在项目根目录创建一个文件 `cookie.txt` （或者其他的位置和名字都可，但以下的部分假设使用这个文件名，如果你使用其他的，注意对应的修改），将拷贝的内容粘贴到文件中。

## 配置文件

在 [config](./config/) 目录中创建配置文件（其他位置也可以），配置文件类型为 JSON 文件，我们给出了一个示例配置文件 [example.json](./config/example.json) ，可以拷贝修改之，需要指定的包括**教学内容**网页的链接（注意是你想要下载的课程的教学内容网页的链接，不是教学网首页的链接），上一步中你的 Cookie 保存的文件的路径，以及你希望下载的文件目录的路径。可以选择性地配置 `incremental` 字段，默认值为 `false` ，如果设置为 `true` ，则会在每次运行时检查上次下载的文件，只下载新增的文件，而不是全部下载，这可以避免重复下载，但**不会检查讲义是否有更新**，只是检查文件是否存在。

## 运行

在项目根目录运行如下命令

```bash
npm run download <配置文件路径>
```

比如

```bash
npm run download ./example.json
```

可以同时给出多个配置文件，比如

```bash
npm run download ./example.json ./example2.json
```

或者

```bash
npm run download./config/*.json
```

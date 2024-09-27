# 小红书API

本内容仅供学习使用，请勿用于非法用途！

## API 清单

|API|Name|接口测试|测试时间|
|:----:|:----:|:-----:|:-----:|
|getNoteById|通过ID获取笔记详情|✓|2024-09-24|
|getSelfInfo|获取个人信息|✓|2024-09-24|
|searchUser|搜索用户|✓|2024-09-24|
|searchNotes|搜索笔记|✓|2024-09-24|
|getUserInfo|获取指定用户详情|✓|2024-09-24|
|getNoteListByUserId|获取指定用户的帖子列表|✓|2024-09-24|

## 使用办法

- 获取 Cookie

<img width="1381" alt="image" src="https://github.com/user-attachments/assets/b3f3c7b7-4419-4199-84d4-c771474a201a">

- 项目拉取

`git clone https://github.com/TONY-STARK-TECH/xhs_api.git`

- 项目配置 `test/xhs.test.js`

```javascript
// Replace with a valid cookie
const cookie = '';
```

```shell
npm install
npm run test
```

<img width="1210" alt="image" src="https://github.com/user-attachments/assets/3632877c-dffd-4dec-bda6-3985fc4cfcaa">

<img width="558" alt="image" src="https://github.com/user-attachments/assets/9a29beac-1ced-4823-bd12-1c5c7c03f883">

## 声明

- 本项目源码修改自 [xhs](https://github.com/2044145178/xhs)
- 本项目接口来自 [xhs](https://github.com/ReaJason/xhs/blob/4b55f82aa682a4ac9ab32ffe4aa5cac568c873c2/xhs/core.py#L435)
- 本项目仅供学习使用，请勿用于商业、非法等用途
- 本项目针对x-s、x-t、x-s-common生成部分均来自 [xhs](https://github.com/2044145178/xhs)
- 本项目不对任何所产生的法律后果负责

# babel-plugin-lazy-load

## 是什么

基于`React.Suspense React.lazy`和`Dynamic Import`，通过此 babel 插件，对开发者无感知的前提下，构建时将组件拆分为对应端的不同 chunk，在运行时判断并懒加载对应端的资源，从而减少首屏文件体积，提高使用者体验。目前设计用于多端组件场景，未来可考虑将转换功能通用化。

转换前

```tsx
import React from 'react'
import { Button } from '@ad/r-ui'

export default function App() {
  return (
    <div className="app">
      <Button type="primary">click me</Button>
    </div>
  )
}
```

转换后

```tsx
import React, { Suspense, lazy } from 'react'
import { useMobile } from '@ad/r-ui'

const Button = (props: any) => {
  // 该逻辑用于判断运行设备是否为移动端，双端组件特有
  const isMobile = useMobile()

  if (isMobile) {
    const MButton = lazy(
      () => import(/* webpackChunkName: 'rui-mobile' */ '@ad/r-ui/es/components/button/mobile')
    )
    return (
      <Suspense fallback={<div>loading~~</div>}>
        <MButton {...props} />
      </Suspense>
    )
  }

  const PCButton = lazy(
    () => import(/* webpackChunkName: 'rui-pc' */ '@ad/r-ui/es/components/button/pc')
  )
  return (
    <Suspense fallback={<div>loading~~</div>}>
      <PCButton {...props} />
    </Suspense>
  )
}

export default function App() {
  return (
    <div className="app">
      <Button type="primary">click me</Button>
    </div>
  )
}
```

使用插件前后构建产物对比
> 待补充图片


## 怎么用

- [babelrc](https://babeljs.io/docs/usage/babelrc/)
- [babel-loader](https://github.com/babel/babel-loader)

```bash
npm install babel-plugin-lazy-load --save-dev
```

Via `.babelrc` or babel-loader.

```js
{
  "plugins": [["lazy-load", options]]
}
```

### options

```ts
interface Options {
  /** 默认@ad/r-ui */
  libraryName?: string
  /** 拆分chunk的名字 */
  chunkNames?: {
    /** pc端chunk名，默认rui-pc */
    pc?: string
    /** 移动端chunk名，默认rui-mobile */
    mobile?: string
  }
  /** 对应端目录 */
  libraryDir?: {
    pc?: LibraryDirType
    mobile?: LibraryDirType
  }
  /** 组件有各自的chunk，默认false，即合并到两端各自的chunk中 */
  splitChunkByComp?: boolean
}
```

## 相关链接

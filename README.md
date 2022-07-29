# babel-plugin-lazy-load

## 是什么

基于`React.Suspense React.lazy`和`Dynamic Import`，通过此 babel 插件，对开发者无感知的前提下，构建时将组件拆分为对应端的不同 chunk，在运行时判断并懒加载对应端的资源，从而减少首屏文件体积，提高使用者体验。目前设计用于多端组件场景，未来可考虑将转换功能通用化。

### 转换前

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

### 转换后

```tsx
import React, { Suspense, lazy, useState, useEffect, forwardRef } from 'react'
import { useMobile } from '@ad/r-ui'

const Button = forwardRef((props, ref) => {
  const isMobile = useMobile();
  const [Comp, setComp] = useState<any>(null);

  useEffect(() => {
    setComp(
      lazy(() =>
        isMobile
          ? import(/* webpackChunkName: 'rui-mobile' */ '@ad/r-ui/es/components/button/mobile')
          : import(/* webpackChunkName: 'rui-pc' */ '@ad/r-ui/es/components/button/pc'),
      ),
    );
  }, [isMobile]);

  return <Suspense fallback={null}>{Comp ? <Comp ref={ref} {...props} /> : null}</Suspense>;
});

export default function App() {
  return (
    <div className="app">
      <Button type="primary">click me</Button>
    </div>
  )
}
```

### 使用插件前后构建产物对比

#### 使用前

<img src="https://github.com/Maxpsc/babel-plugin-lazy-load/raw/main/static/before.png" width="240" alt="使用插件前">

#### 使用后

<img src="https://github.com/Maxpsc/babel-plugin-lazy-load/raw/main/static/after.png" width="600" alt="使用插件后">


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
  /** 详细说明，默认false */
  verbose?: boolean
}
```

## 相关链接

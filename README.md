# babel-plugin-lazy-load
> 双端组件打包在一个bundle中，运行时判断，所有逻辑全在一个js中，导致文件体积过大。急需在工程层面进行优化，降低接入门槛，提高用户体验。


## 是什么
以babel插件的形式，将双端组件依赖拆分对应端的不同chunk，在运行时判断并懒加载对应端的组件资源，从而减少首屏文件体积。

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

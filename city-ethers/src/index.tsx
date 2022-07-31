// React : 框架的核心包
// ReactDom: 专门做渲样相关的包，这个也是必须的
import React from 'react'
import ReactDOM from 'react-dom'
// 引入根组件
import App from './App'

// 渲样根组件 APP, 到一个 id 为 root 的 dom 节点上
ReactDOM.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
  document.getElementById('root')
)

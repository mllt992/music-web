import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue()],
  server: {
    proxy: {
      // WebDAV代理配置 - 支持任意WebDAV服务器
      '^/webdav-proxy/.*': {
        target: 'http://localhost:5173', // 占位符，实际目标会动态设置
        changeOrigin: true,
        secure: false,
        configure: (proxy, _options) => {
          proxy.on('proxyReq', (proxyReq, req, _res, proxyOptions) => {
            try {
              // 从路径中提取协议、主机和路径
              const match = req.url?.match(/^\\/webdav-proxy\\/(https?)\\/([^\\/]+)(\\/.+)?/i)
              if (match) {
                const protocol = match[1].toLowerCase()
                const hostname = decodeURIComponent(match[2])
                const path = match[3] || '/'
                
                proxyReq.setHeader('host', hostname)
                proxyReq.path = path
                
                const target = `${protocol}://${hostname}`
                if (proxyOptions && proxyOptions.target !== target) {
                  proxyOptions.target = target
                }
              }
            } catch (e) {
              console.error('WebDAV代理配置错误:', e)
            }
          })
        }
      }
    }
  }
})

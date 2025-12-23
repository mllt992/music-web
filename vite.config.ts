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
              // 从路径中提取目标主机和路径
              const match = req.url?.match(/^\/webdav-proxy\/([^\/]+)(.*)/)
              if (match) {
                const hostname = match[1]
                const path = match[2] || '/'
                
                // 设置正确的目标主机和路径
                proxyReq.setHeader('host', hostname)
                proxyReq.path = path
                
                // 动态更新代理目标
                const protocol = req.headers['x-forwarded-proto'] || 'https'
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

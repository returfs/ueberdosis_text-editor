// vite.config.ts
import { defineConfig } from "file:///Users/badasukerubin/code/laravel/returfs/marketplace/internal/node_modules/.pnpm/vite@5.4.8_terser@5.35.0/node_modules/vite/dist/node/index.js";
import laravel from "file:///Users/badasukerubin/code/laravel/returfs/marketplace/internal/node_modules/.pnpm/laravel-vite-plugin@1.0.5_vite@5.4.8_terser@5.35.0_/node_modules/laravel-vite-plugin/dist/index.js";
import react from "file:///Users/badasukerubin/code/laravel/returfs/marketplace/internal/node_modules/.pnpm/@vitejs+plugin-react-swc@3.7.0_vite@5.4.8_terser@5.35.0_/node_modules/@vitejs/plugin-react-swc/index.mjs";
import { federation } from "file:///Users/badasukerubin/code/laravel/returfs/marketplace/internal/node_modules/.pnpm/@module-federation+vite@1.0.0_rollup@4.22.5/node_modules/@module-federation/vite/lib/index.cjs";
var vite_config_default = defineConfig({
  build: {
    modulePreload: true,
    target: "esnext",
    minify: true
  },
  experimental: {
    renderBuiltUrl() {
      return { relative: true };
    }
  },
  server: {
    port: 7004,
    origin: "http://localhost:7004"
  },
  base: "http://localhost:7004/",
  plugins: [
    laravel({
      input: ["resources/js/app.tsx"],
      refresh: true
    }),
    react(),
    federation({
      name: "ueberdosis_text-editor",
      filename: "remoteEntry.js",
      getPublicPath: () => "/public/",
      exposes: {
        "./Extension": "./resources/js/Extension"
      },
      remotes: {},
      shared: {
        react: { singleton: true },
        "react-dom": { singleton: true }
      }
    })
  ],
  resolve: {
    alias: {
      "@": "/resources/js"
    }
  }
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCIvVXNlcnMvYmFkYXN1a2VydWJpbi9jb2RlL2xhcmF2ZWwvcmV0dXJmcy9tYXJrZXRwbGFjZS9pbnRlcm5hbC91ZWJlcmRvc2lzL3RleHQtZWRpdG9yXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ZpbGVuYW1lID0gXCIvVXNlcnMvYmFkYXN1a2VydWJpbi9jb2RlL2xhcmF2ZWwvcmV0dXJmcy9tYXJrZXRwbGFjZS9pbnRlcm5hbC91ZWJlcmRvc2lzL3RleHQtZWRpdG9yL3ZpdGUuY29uZmlnLnRzXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ltcG9ydF9tZXRhX3VybCA9IFwiZmlsZTovLy9Vc2Vycy9iYWRhc3VrZXJ1YmluL2NvZGUvbGFyYXZlbC9yZXR1cmZzL21hcmtldHBsYWNlL2ludGVybmFsL3VlYmVyZG9zaXMvdGV4dC1lZGl0b3Ivdml0ZS5jb25maWcudHNcIjtpbXBvcnQgeyBkZWZpbmVDb25maWcgfSBmcm9tICd2aXRlJztcbmltcG9ydCBsYXJhdmVsIGZyb20gJ2xhcmF2ZWwtdml0ZS1wbHVnaW4nO1xuaW1wb3J0IHJlYWN0IGZyb20gJ0B2aXRlanMvcGx1Z2luLXJlYWN0LXN3Yyc7XG5pbXBvcnQgeyBmZWRlcmF0aW9uIH0gZnJvbSAnQG1vZHVsZS1mZWRlcmF0aW9uL3ZpdGUnO1xuXG5leHBvcnQgZGVmYXVsdCBkZWZpbmVDb25maWcoe1xuICBidWlsZDoge1xuICAgIG1vZHVsZVByZWxvYWQ6IHRydWUsXG4gICAgdGFyZ2V0OiAnZXNuZXh0JyxcbiAgICBtaW5pZnk6IHRydWUsXG4gIH0sXG4gIGV4cGVyaW1lbnRhbDoge1xuICAgIHJlbmRlckJ1aWx0VXJsKCkge1xuICAgICAgcmV0dXJuIHsgcmVsYXRpdmU6IHRydWUgfTtcbiAgICB9LFxuICB9LFxuICBzZXJ2ZXI6IHtcbiAgICBwb3J0OiA3MDA0LFxuICAgIG9yaWdpbjogJ2h0dHA6Ly9sb2NhbGhvc3Q6NzAwNCcsXG4gIH0sXG4gIGJhc2U6ICdodHRwOi8vbG9jYWxob3N0OjcwMDQvJyxcbiAgcGx1Z2luczogW1xuICAgIGxhcmF2ZWwoe1xuICAgICAgaW5wdXQ6IFsncmVzb3VyY2VzL2pzL2FwcC50c3gnXSxcbiAgICAgIHJlZnJlc2g6IHRydWUsXG4gICAgfSksXG4gICAgcmVhY3QoKSxcbiAgICBmZWRlcmF0aW9uKHtcbiAgICAgIG5hbWU6ICd1ZWJlcmRvc2lzX3RleHQtZWRpdG9yJyxcbiAgICAgIGZpbGVuYW1lOiAncmVtb3RlRW50cnkuanMnLFxuICAgICAgZ2V0UHVibGljUGF0aDogKCkgPT4gJy9wdWJsaWMvJyxcbiAgICAgIGV4cG9zZXM6IHtcbiAgICAgICAgJy4vRXh0ZW5zaW9uJzogJy4vcmVzb3VyY2VzL2pzL0V4dGVuc2lvbicsXG4gICAgICB9LFxuICAgICAgcmVtb3Rlczoge30sXG4gICAgICBzaGFyZWQ6IHtcbiAgICAgICAgcmVhY3Q6IHsgc2luZ2xldG9uOiB0cnVlIH0sXG4gICAgICAgICdyZWFjdC1kb20nOiB7IHNpbmdsZXRvbjogdHJ1ZSB9LFxuICAgICAgfSxcbiAgICB9KSxcbiAgXSxcbiAgcmVzb2x2ZToge1xuICAgIGFsaWFzOiB7XG4gICAgICAnQCc6ICcvcmVzb3VyY2VzL2pzJyxcbiAgICB9LFxuICB9LFxufSk7XG4iXSwKICAibWFwcGluZ3MiOiAiO0FBQWliLFNBQVMsb0JBQW9CO0FBQzljLE9BQU8sYUFBYTtBQUNwQixPQUFPLFdBQVc7QUFDbEIsU0FBUyxrQkFBa0I7QUFFM0IsSUFBTyxzQkFBUSxhQUFhO0FBQUEsRUFDMUIsT0FBTztBQUFBLElBQ0wsZUFBZTtBQUFBLElBQ2YsUUFBUTtBQUFBLElBQ1IsUUFBUTtBQUFBLEVBQ1Y7QUFBQSxFQUNBLGNBQWM7QUFBQSxJQUNaLGlCQUFpQjtBQUNmLGFBQU8sRUFBRSxVQUFVLEtBQUs7QUFBQSxJQUMxQjtBQUFBLEVBQ0Y7QUFBQSxFQUNBLFFBQVE7QUFBQSxJQUNOLE1BQU07QUFBQSxJQUNOLFFBQVE7QUFBQSxFQUNWO0FBQUEsRUFDQSxNQUFNO0FBQUEsRUFDTixTQUFTO0FBQUEsSUFDUCxRQUFRO0FBQUEsTUFDTixPQUFPLENBQUMsc0JBQXNCO0FBQUEsTUFDOUIsU0FBUztBQUFBLElBQ1gsQ0FBQztBQUFBLElBQ0QsTUFBTTtBQUFBLElBQ04sV0FBVztBQUFBLE1BQ1QsTUFBTTtBQUFBLE1BQ04sVUFBVTtBQUFBLE1BQ1YsZUFBZSxNQUFNO0FBQUEsTUFDckIsU0FBUztBQUFBLFFBQ1AsZUFBZTtBQUFBLE1BQ2pCO0FBQUEsTUFDQSxTQUFTLENBQUM7QUFBQSxNQUNWLFFBQVE7QUFBQSxRQUNOLE9BQU8sRUFBRSxXQUFXLEtBQUs7QUFBQSxRQUN6QixhQUFhLEVBQUUsV0FBVyxLQUFLO0FBQUEsTUFDakM7QUFBQSxJQUNGLENBQUM7QUFBQSxFQUNIO0FBQUEsRUFDQSxTQUFTO0FBQUEsSUFDUCxPQUFPO0FBQUEsTUFDTCxLQUFLO0FBQUEsSUFDUDtBQUFBLEVBQ0Y7QUFDRixDQUFDOyIsCiAgIm5hbWVzIjogW10KfQo=

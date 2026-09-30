import re

with open('src/app/videos/page.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Remove the anonymous banner
content = re.sub(r'\{access === "anonymous" && \([\s\S]*?\}\)', '', content)

# Remove the free banner
content = re.sub(r'\{access === "free" && \([\s\S]*?\}\)', '', content)

# Fix the grid class for cursor
content = content.replace('access !== "premium" ? "cursor-default" : "cursor-pointer"', '"cursor-pointer"')

# Fix the render of the thumbnail
thumbnail_render = """{activeVideoId === video.id && embedUrl ? (
                      <iframe
                        src={embedUrl}
                        title={video.title}
                        className="w-full h-full border-0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      ></iframe>
                    ) : (
                      <div className="text-center text-white p-4 w-full h-full flex flex-col items-center justify-center relative bg-gradient-to-br from-sama-blue to-sama-primary">
                        <i className="fas fa-graduation-cap text-4xl mb-3 opacity-60"></i>
                        <div className="bg-white/20 hover:bg-white/30 backdrop-blur-md px-4 py-2 rounded-full flex items-center gap-2 transition shadow-lg">
                          <i className="fas fa-play text-white text-sm"></i>
                          <span className="text-xs font-bold">Regarder la vidéo</span>
                        </div>
                      </div>
                    )}"""

content = re.sub(r'\{access === "premium" \? \([\s\S]*?\}\)', thumbnail_render, content)

with open('src/app/videos/page.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

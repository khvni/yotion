# Page snapshot

```yaml
- dialog "Unhandled Runtime Error" [ref=e3]:
    - generic [ref=e4]:
        - generic [ref=e5]:
            - generic [ref=e6]:
                - navigation [ref=e7]:
                    - button "previous" [disabled] [ref=e8]:
                        - img "previous" [ref=e9]
                    - button "next" [disabled] [ref=e11]:
                        - img "next" [ref=e12]
                    - generic [ref=e14]: 1 of 1 error
                    - generic [ref=e15]:
                        - text: Next.js (14.2.33) is outdated
                        - link "(learn more)" [ref=e17] [cursor=pointer]:
                            - /url: https://nextjs.org/docs/messages/version-staleness
                - button "Close" [ref=e18] [cursor=pointer]:
                    - img [ref=e20]
            - heading "Unhandled Runtime Error" [level=1] [ref=e23]
            - paragraph [ref=e24]: "TypeError: blocks.sort is not a function"
        - generic [ref=e25]:
            - heading "Source" [level=2] [ref=e26]
            - generic [ref=e27]:
                - link "components/editor/Editor.tsx (133:13) @ sort" [ref=e29] [cursor=pointer]:
                    - generic [ref=e30]: components/editor/Editor.tsx (133:13) @ sort
                    - img [ref=e31]
                - generic [ref=e35]: '131 | <div className="space-y-1"> 132 | {blocks > 133 | ?.sort((a, b) => a.order - b.order) | ^ 134 | .map((block) => ( 135 | <BlockComponent 136 | key={block.id}'
            - heading "Call Stack" [level=2] [ref=e36]
            - button "Show collapsed frames" [ref=e37] [cursor=pointer]
```

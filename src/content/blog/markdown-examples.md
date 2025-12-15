---
title: "Test Post with Slug and Password"
description: "This is a test post to verify the custom slug and password functionality."
pubDate: "2024-01-01"
updatedDate: "2025-11-01"
heroImage: ""
slug: "markdown-sample"
password: "testpassword3"
question: |
  ## Here's the question

  *What does my **Final** project is?*
---

<a name="redirect-to-top"></a>
[Github-flavored Markdown](https://github.github.com/gfm/) is used as syntax.  
Math resolver: `Katex`

## Heading

```markdown
# First-level heading

## Second-level heading

### Third-level heading

#### Fourth-level heading

##### Fifth-level heading

###### Sixth-level heading
```

:::tip
Only first to third level heading will be shown in toc.  
To get links for heading, just render post locally and get links from browser.
:::

## Text format

**Bold**  
_Italicized_  
~~Mistaken~~  
<sub>Subscript</sub>  
<sup>Superscript</sup>  
<ins>Underlined</ins>  
Dash-Dash--

<p style="text-align:center;">Centered</p>

---

...

## Quote

> Quote

## Code

This is `some code`

```zsh
apt upgrade -y
apt autoremove --purge
```

:::tip
To use 3 backticks in code, use 4 backticks to wrap the codeblock.  
To use codeblock in a list, indent the codeblock with 8 spaces.  
Language hints are in [Languages | Shiki](https://shiki.style/languages).
:::

## Links

[Blog](https://amia.work)

## Custom redirect in post

```html
<a name="redirect-to-top"></a>
```

[Redirect to top](#redirect-to-top)

## Paragraph

This is the first line.  
This is the second line.

This is another paragraph.

## Image

![Banner](/images/banner.jpg)

## List

1. This is the first item.
   - This is an item
     - This is an item
2. This is the second item.

## Task

- [x] Finished
- [ ] Not finished

## Footnote

This is a footnote[^1].

[^1]: This is the information.

## Alert

:::note
This is a note.
:::

:::tip
This is a tip.
:::

:::important
This is a important message.
:::

:::warning
This is a warning.
:::

:::caution
This is a caution
:::

:::note[This is a custom title]
This is another note.
:::

## Hidden comment

This is some text.

<!-- This is a hidden comment. -->

## Escape markdown format

Add a backslash (`\`) before the markdown character. For example, \*This is not markdown\*.

## Tables

:::caution
Not working properly, see [Bug: table in post is not aligned per markdown setting](https://github.com/saicaca/fuwari/issues/421).
:::

| Key 1   |  Item 2   |       Key 3 | Key 4     |
| :------ | :-------: | ----------: | --------- |
| Value 1 | `Value 2` | **Value 3** | Value \|4 |

## Collapsed content

<details open>

<summary>This should be unfolded by default</summary>

This is some content

</details>

## Math

$$\sqrt{3x-1}+(1+x)^2$$

$$
\begin{equation*}
\pi
=3.1415926535
 \;8979323846\;2643383279\;5028841971\;6939937510\;5820974944
 \;5923078164\;0628620899\;8628034825\;3421170679\;\ldots
\end{equation*}
$$

:::tip
To escape math syntax, use `\$` inside math block, use `<span>$</span>` outside math block (only for inline).
:::

## Github repo

::github{repo="saicaca/fuwari"}

## Video

<iframe width="560" height="315" src="https://www.youtube-nocookie.com/embed/1W_mSOS1Qts?si=KycqQ4Z9EQNw9OWk" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe>

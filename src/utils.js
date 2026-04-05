function buildTypedContent(html) {
  const template = document.createElement("template");
  template.innerHTML = html;

  const textNodes = [];

  function cloneNode(node) {
    if (node.nodeType === Node.TEXT_NODE) {
      const typedNode = document.createTextNode("");
      textNodes.push({
        sourceText: node.textContent ?? "",
        typedNode,
      });
      return typedNode;
    }

    if (node.nodeType === Node.ELEMENT_NODE) {
      const element = node.cloneNode(false);
      for (const child of node.childNodes) {
        element.appendChild(cloneNode(child));
      }
      return element;
    }

    return document.createTextNode("");
  }

  const fragment = document.createDocumentFragment();
  for (const child of template.content.childNodes) {
    fragment.appendChild(cloneNode(child));
  }

  return { fragment, textNodes };
}

export function displayDialogue(text, onDisplayEnd) {
  const dialogueUI = document.getElementById("textbox-container");
  const dialogue = document.getElementById("dialogue");
  const closeBtn = document.getElementById("close");

  const { fragment, textNodes } = buildTypedContent(text);

  dialogueUI.style.display = "block";
  dialogue.replaceChildren(fragment);

  let currentNodeIndex = 0;
  let currentCharIndex = 0;
  const intervalRef = setInterval(() => {
    while (
      currentNodeIndex < textNodes.length &&
      currentCharIndex >= textNodes[currentNodeIndex].sourceText.length
    ) {
      currentNodeIndex++;
      currentCharIndex = 0;
    }

    if (currentNodeIndex >= textNodes.length) {
      clearInterval(intervalRef);
      return;
    }

    const currentNode = textNodes[currentNodeIndex];
    currentNode.typedNode.textContent += currentNode.sourceText[currentCharIndex];
    currentCharIndex++;
  }, 15);

  function cleanup() {
    clearInterval(intervalRef);
    dialogueUI.style.display = "none";
    dialogue.replaceChildren();
    closeBtn.removeEventListener("click", onCloseBtnClick);
    window.removeEventListener("keydown", onKeyDown);
    onDisplayEnd();
  }

  function onCloseBtnClick() {
    cleanup();
  }

  function onKeyDown(event) {
    if (event.code !== "Enter") return;
    event.preventDefault();
    cleanup();
  }

  closeBtn.addEventListener("click", onCloseBtnClick);
  window.addEventListener("keydown", onKeyDown);
}

export function setCamScale(k) {
  const resizeFactor = k.width() / k.height();
  if (resizeFactor < 1) {
    k.camScale(k.vec2(1));
  } else {
    k.camScale(k.vec2(1.5));
  }
}

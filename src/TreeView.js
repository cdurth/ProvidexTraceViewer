import React, { useState, useEffect } from "react";
import "./TreeView.css";

const parseDataToTree = (data) => {
    const lines = data.split("\n").map((line, index) => {
        const depth = line.match(/^(: )*/)[0].length / 2;
        const text = line.replace(/^(: )*/, "");
        return { depth, text, line: index + 1 };
    });

    const root = { depth: -1, children: [] };
    let node = root;
    for (let line of lines) {
        while (node && node.depth >= line.depth) {
            node = node.parent;
        }
        line.children = [];
        line.parent = node;
        node.children.push(line);
        node = line;
    }
    return root.children;
};

const HighlightedSyntax = ({ text }) => {
    const keywords = ["LET", "THEN", "IF", "ELSE", "SWITCH", "END", "GOSUB", "NEXT", "AND", "OR", "WHILE","WEND"];
    let pvxMethodNames = ["NOT","NUL","UCS","POS","SUB","MID"];

    return (
        <span>
            {text.split(/\s+/).map((token, index, arr) => {
                let pattern = new RegExp(/(\bNOT\b|\bNUL\b|\(|\))/g);
                const tokenParts = Array.from(token.split(pattern), part => part || "");

                return (
                    <span key={index}>
                        {tokenParts.map((tokenPart, partIndex) => {
                            let subTokenParts = tokenPart.split(/("(?:\\"|[^"])*")/);

                            return (
                                subTokenParts.map((subToken, subIndex) => {
                                    let className = "";

                                    if (keywords.includes(subToken.toUpperCase())) {
                                        className = "token-keyword";
                                        if (arr[index + 1] && arr[index + 1].trim() === "(") {
                                            pvxMethodNames.push(subToken);
                                        }
                                    } else if (subToken === "(" || subToken === ")") {
                                        className = "token-bracket";
                                    } else if (pvxMethodNames.includes(subToken)) {
                                        className = "token-method";
                                    } else if (subToken.startsWith('"') && subToken.endsWith('"')) {
                                        className = "token-quoted";
                                    } else if (subToken.endsWith(':') || subToken.toUpperCase() == "RETURN") {
                                        className = "token-label";
                                    }
                                    
                                    return (
                                        <span key={`${partIndex}-${subIndex}`} className={className}>
                                            {subToken}
                                        </span>
                                    );
                                })
                            );

                        })}
                        {index < text.split(/\s+/).length - 1 && ' '}
                    </span>
                );
            })}
        </span>
    );
};

const TreeNode = ({ node, lineNumber }) => {
    const [isCollapsed, setIsCollapsed] = useState(false);
    const handleClick = () => setIsCollapsed(!isCollapsed);
  
    let classes = "line-number";
    if (!lineNumber) {
      classes += " empty";
    }
  
    return (
      <div style={{ display: "flex" }} id={lineNumber ? `line-${lineNumber}` : undefined} > {/* Include the id for line number */}
        <div className={classes} style={{ paddingRight: "10px", flexShrink: 0 }}>
          {lineNumber ? <a href={`#line-${lineNumber}`}>{lineNumber}</a> : null} {/* Make line number an anchor link */}
        </div>
        <div>
          <div className="editor-line" onClick={handleClick}>
            <span className="expand-collapse-icon">
              {node.children.length ? (isCollapsed ? "+" : "-") : "  "}
            </span>
            <HighlightedSyntax text={node.text} />
          </div>
          {!isCollapsed && 
            node.children.map((child, index) => 
              (<TreeNode key={index} node={child} lineNumber={child.line} />
          ))}
        </div>
      </div>
    );
  };

const TreeView = () => {
  const [isTextareaVisible, setIsTextareaVisible] = useState(true);
  const [tempData, setTempData] = useState(localStorage.getItem('treeData') || '');
  const [data, setData] = useState('');
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    const savedData = localStorage.getItem('treeData');
    if (savedData) {
      setData(savedData);
    }

    if (isDarkMode) {
      document.body.classList.add('dark-mode');
    } else {
      document.body.classList.remove('dark-mode');
    }
  }, [data, isDarkMode]);

  const loadData = () => {
    const trimmedData = tempData.split('\n').map((line) => line.trim()).join('\n');
    setData(trimmedData);
  };

  const clearData = () => {
    setTempData("");
    localStorage.removeItem("treeData");
  };

  const toggleDarkMode = () => {
    setIsDarkMode((prevMode) => !prevMode);
  };

  const handleToggleTextarea = () => {
    setIsTextareaVisible(!isTextareaVisible);
  }

  const treeData = parseDataToTree(data);

  return (
    <div className="tree-view">

      {isTextareaVisible && (
        <textarea
          className="tree-data-input"
          placeholder="Paste PVX Trace here..."
          value={tempData}
          onChange={(e) => setTempData(e.target.value)}
        />
      )}

      <div className="buttons">
        <button onClick={loadData}>Load Data</button>
        <button onClick={clearData}>Clear Data</button>
        <button onClick={handleToggleTextarea}>
          {isTextareaVisible ? 'Hide Trace Window' : 'Show Trace Window'}
        </button>
        <button onClick={toggleDarkMode}>Toggle Dark Mode</button>
      </div>

      {treeData.map((node, index) => (
        <TreeNode key={index} node={node} lineNumber={node.line} />
      ))}
    </div>
  );
};

export default TreeView;
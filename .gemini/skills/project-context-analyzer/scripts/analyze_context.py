import os
import sys
import argparse

def analyze_project_context(keyword: str, root_dir: str) -> str:
    """
    Busca por uma palavra-chave nos modelos, rotas e componentes do projeto.
    """
    # Map relative paths from project root
    directories_to_search = [
        "backend/app/database",
        "backend/app/schemas",
        "backend/app/routers",
        "frontend/src/components"
    ]
    
    results = []
    keyword_lower = keyword.lower()
    
    for rel_dir in directories_to_search:
        directory = os.path.join(root_dir, rel_dir)
        if not os.path.exists(directory):
            continue
            
        for root, _, files in os.walk(directory):
            for file in files:
                if file.endswith((".py", ".ts", ".tsx")):
                    file_path = os.path.join(root, file)
                    try:
                        with open(file_path, 'r', encoding='utf-8') as f:
                            content = f.read()
                            if keyword_lower in content.lower():
                                # Return path relative to project root
                                display_path = os.path.relpath(file_path, root_dir)
                                results.append(f"- {display_path}")
                    except Exception:
                        continue

    if not results:
        return f"Nenhuma referência encontrada para '{keyword}' nos locais monitorados."
    
    # Sort and remove duplicates
    results = sorted(list(set(results)))
    
    output = f"Resultados para '{keyword}':\n" + "\n".join(results)
    return output

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Busca contexto do projeto.")
    parser.add_argument("keyword", help="Palavra-chave para buscar")
    parser.add_argument("--root", default=os.getcwd(), help="Diretório raiz do projeto")
    
    args = parser.parse_args()
    
    print(analyze_project_context(args.keyword, args.root))

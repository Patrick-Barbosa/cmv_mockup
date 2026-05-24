import os
import argparse

def get_ui_guidelines(root_dir: str) -> str:
    """
    Lê e retorna o guia de estilos e os componentes UI registrados no projeto.
    """
    style_path = os.path.join(root_dir, "frontend/agent_knowledge/style.md")
    components_path = os.path.join(root_dir, "frontend/components.json")
    
    output = "## Guia de Estilos (style.md)\n\n"
    
    if os.path.exists(style_path):
        try:
            with open(style_path, 'r', encoding='utf-8') as f:
                output += f.read() + "\n\n"
        except Exception as e:
            output += f"Erro ao ler style.md: {str(e)}\n\n"
    else:
        output += "Arquivo style.md não encontrado em frontend/agent_knowledge/.\n\n"
        
    output += "## Componentes Disponíveis (components.json)\n\n"
    
    if os.path.exists(components_path):
        try:
            with open(components_path, 'r', encoding='utf-8') as f:
                output += f.read() + "\n"
        except Exception as e:
            output += f"Erro ao ler components.json: {str(e)}\n"
    else:
        output += "Arquivo components.json não encontrado na raiz do frontend.\n"
        
    return output

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Lê diretrizes de UI do projeto.")
    parser.add_argument("--root", default=os.getcwd(), help="Diretório raiz do projeto")
    
    args = parser.parse_args()
    print(get_ui_guidelines(args.root))

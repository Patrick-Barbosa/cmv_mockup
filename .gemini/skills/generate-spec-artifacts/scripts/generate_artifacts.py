import os
import argparse
from datetime import datetime
import sys

def generate_spec_artifacts(
    root_dir: str,
    issue_title: str, 
    requisitos_negocio: str, 
    criterios_aceite: list, 
    tarefas_backend: list, 
    tarefas_frontend: list
) -> str:
    """
    Cria a pasta datada da issue no brain/ e gera os 3 arquivos de especificação.
    """
    # Formata a data atual DD-MM-YY
    today_str = datetime.now().strftime("%d-%m-%y")
    brain_base = os.path.join(root_dir, "brain")
    base_dir = os.path.join(brain_base, today_str)
    
    # Cria o diretório do dia se não existir
    os.makedirs(base_dir, exist_ok=True)
    
    # Descobre o próximo ID da issue
    existing_issues = [d for d in os.listdir(base_dir) if os.path.isdir(os.path.join(base_dir, d)) and d.startswith("issue-")]
    next_issue_num = len(existing_issues) + 1
    issue_folder_name = f"issue-{next_issue_num:02d}"
    
    issue_dir = os.path.join(base_dir, issue_folder_name)
    os.makedirs(issue_dir, exist_ok=True)
    
    # 1. Escreve 00-requisitos-de-negocio.md
    with open(os.path.join(issue_dir, "00-requisitos-de-negocio.md"), "w", encoding="utf-8") as f:
        f.write(f"# Requisitos de Negócio - {issue_title}\n\n")
        f.write(requisitos_negocio + "\n")
        
    # 2. Escreve 01-criterios-de-aceite.md
    with open(os.path.join(issue_dir, "01-criterios-de-aceite.md"), "w", encoding="utf-8") as f:
        f.write(f"# Critérios de Aceite - {issue_title}\n\n")
        for criterio in criterios_aceite:
            f.write(f"- [ ] {criterio}\n")
            
    # 3. Escreve 02-tarefas-tecnicas.md
    with open(os.path.join(issue_dir, "02-tarefas-tecnicas.md"), "w", encoding="utf-8") as f:
        f.write(f"# Tarefas Técnicas - {issue_title}\n\n")
        
        f.write("## Backend Dev\n")
        if tarefas_backend:
            for tb in tarefas_backend:
                f.write(f"1. {tb}\n")
        else:
            f.write("- Nenhuma tarefa de backend mapeada.\n")
            
        f.write("\n## Frontend Dev\n")
        if tarefas_frontend:
            for tf in tarefas_frontend:
                f.write(f"1. {tf}\n")
        else:
            f.write("- Nenhuma tarefa de frontend mapeada.\n")
            
    return f"Sucesso! Artefatos criados em: {os.path.relpath(issue_dir, root_dir)}/"

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Gera artefatos de especificação.")
    parser.add_argument("--root", default=os.getcwd(), help="Diretório raiz do projeto")
    parser.add_argument("--title", required=True, help="Título da Issue")
    parser.add_argument("--requisitos", required=True, help="Texto dos requisitos de negócio")
    parser.add_argument("--criterio", action="append", default=[], help="Critério de aceite (pode ser repetido)")
    parser.add_argument("--backend", action="append", default=[], help="Tarefa de backend (pode ser repetido)")
    parser.add_argument("--frontend", action="append", default=[], help="Tarefa de frontend (pode ser repetido)")
    
    args = parser.parse_args()
    
    try:
        print(generate_spec_artifacts(
            args.root,
            args.title,
            args.requisitos,
            args.criterio,
            args.backend,
            args.frontend
        ))
    except Exception as e:
        print(f"Erro: {str(e)}")
        sys.exit(1)

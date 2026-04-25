import os
from pathlib import Path

def main():
    print("--- Configuração de Documentação de Agentes ---")
    
    # Escolha do Sistema Operacional
    while True:
        os_choice = input("Escolha o ambiente (1: Linux, 2: Windows): ").strip()
        if os_choice in ['1', '2']:
            os_name = "Linux" if os_choice == '1' else "Windows"
            break
        print("Escolha inválida. Use 1 ou 2.")

    # Escolha do Agente
    while True:
        agent_choice = input("Qual coding agent você está usando? (1: Codex, 2: Gemini CLI): ").strip()
        if agent_choice in ['1', '2']:
            target_agent = "Codex" if agent_choice == '1' else "Gemini"
            break
        print("Escolha inválida. Use 1 or 2.")

    # Definição de nomes baseada na escolha
    if target_agent == "Codex":
        old_name = "GEMINI.md"
        new_name = "AGENTS.md"
    else:
        old_name = "AGENTS.md"
        new_name = "GEMINI.md"

    print(f"\nAmbiente detectado: {os_name}")
    print(f"Agente selecionado: {target_agent}")
    print(f"Renomeando todos os '{old_name}' para '{new_name}'...\n")

    root_dir = Path(".")
    renamed_count = 0

    # Percorre o diretório recursivamente
    for path in root_dir.rglob(old_name):
        # Ignora pastas de ambiente virtual ou git para performance e segurança
        if any(part in path.parts for part in ['.venv', 'venv', '.git', 'node_modules', '__pycache__']):
            continue
            
        new_path = path.with_name(new_name)
        try:
            path.rename(new_path)
            print(f"Renomeado: {path} -> {new_name}")
            renamed_count += 1
        except Exception as e:
            print(f"Erro ao renomear {path}: {e}")

    print(f"\nOperação concluída. {renamed_count} arquivos renomeados.")

if __name__ == "__main__":
    main()

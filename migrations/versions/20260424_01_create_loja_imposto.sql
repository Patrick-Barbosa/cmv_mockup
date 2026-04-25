CREATE TABLE loja_imposto (
    id SERIAL PRIMARY KEY,
    id_loja VARCHAR NOT NULL,
    imposto_percentual FLOAT NOT NULL DEFAULT 14.0,
    data_criacao TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX ix_loja_imposto_id_loja ON loja_imposto (id_loja);

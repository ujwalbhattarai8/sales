IF OBJECT_ID('sales.get_customer_account_detail') IS NOT NULL
DROP FUNCTION sales.get_customer_account_detail;
GO

CREATE FUNCTION sales.get_customer_account_detail
(
    @customer_id			integer,
    @from					date,
    @to						date,
	@office_id				integer
)
RETURNS @result TABLE
(
  
  id						integer IDENTITY, 
  value_date				date, 
  invoice_number			bigint, 
  statement_reference		text, 
  debit						numeric(30, 6), 
  credit					numeric(30, 6), 
  balance					numeric(30, 6)
) 
AS
BEGIN
    INSERT INTO @result
	(
		value_date, 
		invoice_number, 
		statement_reference, 
		debit, 
		credit
	)
    SELECT 
		customer_transaction_view.value_date,
        customer_transaction_view.invoice_number,
        customer_transaction_view.statement_reference,
        customer_transaction_view.debit,
        customer_transaction_view.credit
    FROM sales.customer_transaction_view
    LEFT JOIN inventory.customers 
		ON customer_transaction_view.customer_id = customers.customer_id
	LEFT JOIN sales.sales_view
		ON sales_view.invoice_number = customer_transaction_view.invoice_number
    WHERE customer_transaction_view.customer_id = @customer_id
	AND customers.deleted = 0
	AND sales_view.office_id = @office_id
    AND customer_transaction_view.value_date BETWEEN @from AND @to;

    UPDATE @result 
    SET balance = c.balance
	FROM @result as result
    INNER JOIN
    (
        SELECT p.id,
            SUM(COALESCE(c.debit, 0) - COALESCE(c.credit, 0)) As balance
        FROM @result p
        LEFT JOIN @result c
        ON c.id <= p.id
        GROUP BY p.id
    ) AS c
    ON result.id = c.id;

    RETURN 
END

GO
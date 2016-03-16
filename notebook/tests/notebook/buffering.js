//
// Test buffering for execution requests.
//
casper.notebook_test(function () {
    this.then(function() {
      // make sure there are at least three cells for the tests below.
      this.append_cell();
      this.append_cell();
      this.append_cell();
    })

    this.thenEvaluate(function () {
        IPython.notebook.kernel.stop_channels();
        var cell = IPython.notebook.get_cell(0);
        cell.set_text('a=10; print(a)');
        IPython.notebook.execute_cells([0]);
        IPython.notebook.kernel.reconnect(1);
    });

    this.wait_for_output(0);

    this.then(function () {
        var result = this.get_output_cell(0);
        this.test.assertEquals(result.text, '10\n', 'kernels buffer execution requests if connection is down');
    });

    this.thenEvaluate(function () {
        var cell = IPython.notebook.get_cell(0);
        cell.set_text('a=11; print(a)');
        cell.kernel = null;
        IPython.notebook.kernel = null;
        IPython.notebook.execute_cells([0]);
        IPython.notebook._session_started();
    });

    this.wait_for_output(0);

    this.then(function () {
        var result = this.get_output_cell(0);
        this.test.assertEquals(result.text, '11\n', 'notebooks buffer cell execution requests if kernel is not set');
    });
    
    // Repeated execution behavior differs in the two queues

    this.thenEvaluate(function () {

        var cell = IPython.notebook.get_cell(0);
        var cellplus = IPython.notebook.get_cell(1);
        var cellprint = IPython.notebook.get_cell(2);
        cell.set_text('k=1');
        cellplus.set_text('k+=1');
        cellprint.set_text('k*=2')

        IPython.notebook.kernel.stop_channels();

        // Repeated execution of cell queued up in the kernel executes
        // each execution request.
        IPython.notebook.execute_cells([0]);
        IPython.notebook.execute_cells([2]);
        IPython.notebook.execute_cells([1]);
        IPython.notebook.execute_cells([1]);
        IPython.notebook.execute_cells([1]);
        cellprint.set_text('print(k)')
        IPython.notebook.execute_cells([2]);        

        IPython.notebook.kernel.reconnect(1);
    });

    this.wait_for_output(2);
    
    this.then(function () {
        var result = this.get_output_cell(2);
        this.test.assertEquals(result.text, '5\n', 'kernel message buffer sends each message queued');
    });

    this.thenEvaluate(function () {

        var cell = IPython.notebook.get_cell(0);
        var cellplus = IPython.notebook.get_cell(1);
        var cellprint = IPython.notebook.get_cell(2);
        cell.set_text('n=1');
        cellplus.set_text('n+=1');
        cellprint.set_text('n*=2')

        cell.kernel = null;
        cellplus.kernel = null;
        cellprint.kernel = null;
        IPython.notebook.kernel = null;

        // Repeated execution of cell queued up in the notebook moves the cell
        // to the end of the queue, only executing it once.
        IPython.notebook.execute_cells([0]);
        IPython.notebook.execute_cells([2]);
        IPython.notebook.execute_cells([1]);
        IPython.notebook.execute_cells([1]);
        IPython.notebook.execute_cells([1]);
        cellprint.set_text('print(n)')
        IPython.notebook.execute_cells([2]);        

        IPython.notebook._session_started();
    });

    this.wait_for_output(2);
    
    this.then(function () {
        var result = this.get_output_cell(2);
        this.test.assertEquals(result.text, '2\n', 'notebook execution buffer moves repeatedly executed cell to end of queue');
    });

});

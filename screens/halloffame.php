<div id="hof" class="overlay">
    <h1 class="blue-text">HALL OF FAME</h1>
        <?php
        // connect to db
        $conn_string = "host=ec2-174-129-1-179.compute-1.amazonaws.com port=5432 dbname=d6e1frjth87pfd user=cizbwdxggeralb password=Vxbh0ac32QujliNdiV74wBe11N sslmode=require";
        $conn = pg_connect($conn_string);
        

        if ($conn) :
            $query = "SELECT * FROM high_score ORDER BY score DESC LIMIT 10";
            $result = pg_query($conn, $query);
        ?>
            <table id="hof-table">
                <tr>
                    <th></th>
                    <th>MAP</th>
                    <th>PLAYER</th>
                    <th>WAVE</th>
                    <th>SCORE</th>
                </tr>
            <?php
                $i = 1;
                while ($row = pg_fetch_object($result)) :
            ?>
                    <tr>
                        <td><?php echo $i; ?></td>
                        <td><?php echo $row->map; ?></td>
                        <td><?php echo $row->player; ?></td>
                        <td><?php echo $row->wave; ?></td>
                        <td><?php echo $row->score; ?></td>
                    </tr>
            <?php
                $i++;
                endwhile;
            ?>
            </table>
        <?php endif; ?>
        
        <div class="menu-btn main-menu main-menu-gs">< MAIN MENU</div>
</div>
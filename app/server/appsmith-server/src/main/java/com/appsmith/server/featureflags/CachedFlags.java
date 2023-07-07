package com.appsmith.server.featureflags;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;
import java.time.Instant;
import java.util.Map;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CachedFlags implements Serializable {
    Map<String, Boolean> flags;
    Instant refreshedAt;
}
